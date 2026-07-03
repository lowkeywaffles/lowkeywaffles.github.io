import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Send booking notification email
async function sendBookingNotification(bookingData: any, amount: number, paymentMethod: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || 'your-email@gmail.com',
        pass: process.env.GMAIL_PASSWORD || 'your-app-password',
      },
    });

    const checkOutDate = new Date(bookingData.checkInDate);
    checkOutDate.setMonth(checkOutDate.getMonth() + (bookingData.duration || 1));
    
    const emailContent = `
      <h2>New Booking Received! 🎉</h2>
      <p><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
      <hr/>
      
      <h3>Guest Information</h3>
      <p><strong>Name:</strong> ${bookingData.name}</p>
      <p><strong>Email:</strong> ${bookingData.email}</p>
      <p><strong>Phone:</strong> ${bookingData.phone}</p>
      
      <h3>Booking Details</h3>
      <p><strong>Check-in Date:</strong> ${bookingData.checkInDate}</p>
      <p><strong>Check-out Date:</strong> ${checkOutDate.toLocaleDateString()}</p>
      <p><strong>Duration:</strong> ${bookingData.duration} month(s)</p>
      <p><strong>Unit Type:</strong> ${bookingData.roomType === '2br' ? '2-Bedroom' : '1-Bedroom'}</p>
      <p><strong>Special Requests:</strong> ${bookingData.notes || 'None'}</p>
      
      <h3>Payment Information</h3>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">CONFIRMED</span></p>
      
      <hr/>
      <p><em>This is an automated notification. Please contact the guest at ${bookingData.phone} to confirm arrival time and other details.</em></p>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER || 'your-email@gmail.com',
      to: process.env.OWNER_EMAIL || 'amanuelyared45@gmail.com',
      subject: `New Booking: ${bookingData.name} - ${bookingData.roomType === '2br' ? '2BR' : '1BR'} Unit`,
      html: emailContent,
    });

    console.log('[Email] Booking notification sent to', process.env.OWNER_EMAIL);
  } catch (error) {
    console.error('[Email Error]', error);
  }
}
const PAYPAL_API_URL = 'https://api.sandbox.paypal.com';

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

  console.log('[Payment] Telebirr payment proof received:', {
    fileName,
    fileSize: proofFile.length,
    amount,
    bookingData,
    timestamp: new Date().toISOString(),
  });

  // Send booking notification email
  await sendBookingNotification(bookingData, amount, 'telebirr');

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

  // Save booking + mark room as reserved in Neon
  try {
    const db = neon(process.env.DATABASE_URL!);
    const { bookingData } = body;
    console.log('[DB URL]', process.env.POSTGRES_URL?.slice(0, 50));

    const checkOutDate = new Date(bookingData.checkInDate);
    checkOutDate.setMonth(checkOutDate.getMonth() + (bookingData.duration || 1));

    await db`
      INSERT INTO bookings (
        paypal_order_id, guest_name, guest_email, guest_phone,
        room_type, check_in_date, check_out_date, duration,
        amount, notes, status
      ) VALUES (
        ${body.orderID},
        ${bookingData.name},
        ${bookingData.email},
        ${bookingData.phone},
        ${bookingData.roomType},
        ${bookingData.checkInDate},
        ${checkOutDate.toISOString().split('T')[0]},
        ${bookingData.duration},
        ${body.amount},
        ${bookingData.notes || ''},
        'confirmed'
      )
    `;

    // Mark a room of the correct type as reserved
    await db`
      UPDATE rooms
      SET status = 'reserved'
      WHERE id = (
        SELECT id FROM rooms
        WHERE room_type = ${bookingData.roomType}
        AND status = 'available'
        LIMIT 1
      )
    `;

} catch (dbError: any) {
    console.error('[DB Error]', dbError?.message || dbError);
    // Temporarily return the error so we can see it
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      dbError: dbError?.message || String(dbError),
    });
  }


          // Send booking notification email
          await sendBookingNotification(body.bookingData, body.amount, 'paypal');

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
