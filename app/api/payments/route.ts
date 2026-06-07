import { NextRequest, NextResponse } from 'next/server';

// PayPal API endpoints
const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Create PayPal order
async function createPayPalOrder(
  amount: number,
  bookingData: any
) {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: amount.toString(),
          },
          description: `Maranatha Apartment Booking - ${bookingData.duration} months`,
          custom_id: bookingData.email,
        },
      ],
      payer: {
        name: {
          given_name: bookingData.name.split(' ')[0],
          surname: bookingData.name.split(' ').slice(1).join(' ') || 'Guest',
        },
        email_address: bookingData.email,
      },
    }),
  });

  const data = await response.json();
  return data;
}

// Capture PayPal order
async function capturePayPalOrder(orderID: string) {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64');

  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    }
  );

  const data = await response.json();
  return data;
}

// Handle Telebirr payment proof
async function processTelebirrPayment(
  amount: number,
  proofFile: Buffer,
  fileName: string,
  bookingData: any
) {
  // Validate file
  if (!fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return {
      success: false,
      message: 'Invalid file format. Please upload an image.',
    };
  }

  // In production, you would:
  // 1. Upload to secure storage (Vercel Blob)
  // 2. Send to admin email for verification
  // 3. Create a booking record in database
  // For now, we'll accept and log it

  console.log('[Payment] Telebirr payment proof received:', {
    fileName,
    fileSize: proofFile.length,
    amount,
    bookingData,
    timestamp: new Date().toISOString(),
  });

  // Send confirmation email (in production)
  // await sendConfirmationEmail(bookingData.email, amount, bookingData);

  return {
    success: true,
    message: 'Payment proof received. Your booking is pending verification.',
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      // Handle PayPal requests
      const body = await request.json();

      if (body.method === 'paypal') {
        // Create PayPal order
        const paypalOrder = await createPayPalOrder(body.amount, body.bookingData);

        if (paypalOrder.id) {
          return NextResponse.json({
            success: true,
            orderID: paypalOrder.id,
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to create PayPal order',
              error: paypalOrder,
            },
            { status: 400 }
          );
        }
      } else if (body.method === 'paypal-capture') {
        // Capture PayPal order
        const capturedOrder = await capturePayPalOrder(body.orderID);

        if (
          capturedOrder.status === 'COMPLETED' ||
          capturedOrder.status === 'APPROVED'
        ) {
          // Log booking
          console.log('[Payment] PayPal payment successful:', {
            orderID: body.orderID,
            bookingData: body.bookingData,
            timestamp: new Date().toISOString(),
          });

          return NextResponse.json({
            success: true,
            message: 'Payment processed successfully',
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              message: 'Payment capture failed',
              error: capturedOrder,
            },
            { status: 400 }
          );
        }
      }
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle Telebirr file upload
      const formData = await request.formData();
      const method = formData.get('method') as string;
      const amount = parseFloat(formData.get('amount') as string);
      const proof = formData.get('proof') as File;
      const bookingDataStr = formData.get('bookingData') as string;
      const bookingData = JSON.parse(bookingDataStr);

      if (method === 'telebirr' && proof) {
        const buffer = await proof.arrayBuffer();
        const result = await processTelebirrPayment(
          amount,
          Buffer.from(buffer),
          proof.name,
          bookingData
        );

        if (result.success) {
          return NextResponse.json(result);
        } else {
          return NextResponse.json(result, { status: 400 });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Payment API Error]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
