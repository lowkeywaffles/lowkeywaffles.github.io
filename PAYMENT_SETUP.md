# Maranatha Furnished Apartments - Payment Integration Setup Guide

## Overview

Your booking system is ready! The frontend includes:
- Beautiful booking modal with form validation
- Pricing display (USD and ETB)
- Security deposit calculation (20%)
- Payment method selection (PayPal + Telebirr)

Now you need to configure the payment integrations to process real bookings.

---

## Step 1: Set Up Environment Variables

Create or update `.env.local` file in your project root:

```bash
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here

# Telebirr Configuration
TELEBIRR_MERCHANT_ID=your_telebirr_merchant_id_here
TELEBIRR_API_KEY=your_telebirr_api_key_here

# Optional: Stripe (if you want to add as backup)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

---

## Option A: PayPal Integration

### 1. Create a PayPal Business Account

1. Visit [PayPal Developer](https://developer.paypal.com)
2. Sign in or create a new account
3. Go to **Sandbox** first for testing

### 2. Get Your Client ID

1. In the Developer Dashboard, go to **Apps & Credentials**
2. Make sure you're in **Sandbox** mode
3. Select your app or create a new one
4. Copy the **Client ID**
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=ABC123XYZ...
   ```

### 3. Add PayPal SDK to Frontend

The booking modal is ready, but you'll need to add PayPal button integration. Here's how to update the booking modal:

Add this to `components/booking-modal.tsx` in the payment step:

```tsx
// Add this import at the top
import Script from 'next/script'

// In the payment step section, add:
<Script
  src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID"
  strategy="lazyOnload"
/>

// Then add a div for the PayPal button:
<div id="paypal-button-container" className="mt-4"></div>
```

### 4. Handle PayPal Callbacks

Update `app/api/payments/route.ts` to verify PayPal transactions:

```typescript
// PayPal verification endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transaction_id')
  
  // Verify with PayPal API
  // Documentation: https://developer.paypal.com/api/orders/v2/
}
```

---

## Option B: Telebirr Integration (Ethiopia)

### 1. Register with Telebirr

1. Visit [Telebirr Merchant Portal](https://www.telebirr.com/merchants)
2. Create a merchant account
3. Complete KYC verification
4. Request API access

### 2. Get Merchant Credentials

1. In your Telebirr dashboard, go to **API Settings**
2. Copy your **Merchant ID** and **API Key**
3. Add to `.env.local`:
   ```
   TELEBIRR_MERCHANT_ID=merchant_123456
   TELEBIRR_API_KEY=your_api_key_here
   ```

### 3. Implement Telebirr Payment

Update `app/api/payments/route.ts`:

```typescript
// Telebirr payment implementation
const TELEBIRR_BASE_URL = 'https://api.telebirr.com/v1'

async function processTelebirrPayment(bookingData, totalAmount) {
  const response = await fetch(`${TELEBIRR_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TELEBIRR_API_KEY}`,
    },
    body: JSON.stringify({
      merchant_id: process.env.TELEBIRR_MERCHANT_ID,
      amount: totalAmount, // in ETB
      reference: `booking_${bookingData.checkInDate}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telebirr`,
      phone_number: bookingData.phone,
      description: `Maranatha Booking - ${bookingData.roomType}`,
    }),
  })

  return response.json()
}
```

### 4. Set Up Webhook Handler

Create `app/api/webhooks/telebirr/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const payload = await request.json()
  
  // Verify webhook signature
  // Process successful payment
  // Update booking status
  
  return NextResponse.json({ received: true })
}
```

---

## Step 2: Update Booking Modal

The current booking modal collects all necessary information but doesn't process payments yet. Here's what to add:

### Current Flow:
1. ✅ Collect guest details
2. ✅ Select payment method
3. ⚠️ Process payment (needs implementation)
4. ✅ Show confirmation

### To Process Real Payments:

In `components/booking-modal.tsx`, update the payment submission:

```tsx
const handlePaymentSubmit = async () => {
  if (!bookingData) return;
  
  try {
    // Call your payment API
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingData,
        paymentMethod: bookingData.paymentMethod,
        totalAmount: totalCost + securityDeposit,
      }),
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Redirect to payment gateway or show confirmation
      setStep('confirmation')
    }
  } catch (error) {
    console.error('Payment error:', error)
    // Show error to user
  }
}
```

---

## Step 3: Testing

### Test PayPal (Sandbox)
- Use test credentials from PayPal Dashboard
- Test account details are provided in Sandbox
- Transactions won't affect real money

### Test Telebirr (Sandbox)
- Use test phone numbers: `+251911000000`
- Small test amounts (1-5 ETB)
- Contact Telebirr support for test credentials

---

## Step 4: Deploy to Vercel

### 1. Add Environment Variables to Vercel

```bash
vercel env add NEXT_PUBLIC_PAYPAL_CLIENT_ID
vercel env add TELEBIRR_MERCHANT_ID
vercel env add TELEBIRR_API_KEY
```

Or via Vercel Dashboard:
1. Go to your project settings
2. Click **Environment Variables**
3. Add each variable
4. Redeploy

### 2. Deploy
```bash
git push origin main
# or
vercel deploy --prod
```

---

## Step 5: Booking Confirmation

Currently, bookings show a confirmation screen. To make it production-ready:

### Add Email Notifications

Create `app/api/email/route.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { bookingData, totalAmount } = await request.json()
  
  await resend.emails.send({
    from: 'Maranatha Apartments <bookings@maranatha.com>',
    to: bookingData.email,
    subject: 'Booking Confirmation - Maranatha Furnished Apartments',
    html: `
      <h1>Booking Confirmed!</h1>
      <p>Guest: ${bookingData.name}</p>
      <p>Check-in: ${bookingData.checkInDate}</p>
      <p>Total: $${totalAmount}</p>
    `,
  })
  
  return NextResponse.json({ sent: true })
}
```

### Add WhatsApp Integration

Use [Twilio](https://www.twilio.com) or [WhatsApp Business API](https://www.whatsapp.com/business/api) to send confirmations to the guest's phone number.

---

## API Endpoints Reference

### Create Booking Payment
**POST** `/api/payments`

```json
{
  "bookingData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+251911654766",
    "checkInDate": "2025-02-01",
    "duration": "3",
    "notes": "Optional notes"
  },
  "paymentMethod": "paypal" | "telebirr",
  "totalAmount": 2280
}
```

Response:
```json
{
  "success": true,
  "method": "paypal",
  "bookingId": "booking_1706836400000",
  "redirectUrl": "https://checkout.paypal.com/..."
}
```

---

## Pricing Reference

**2-Bedroom Units:**
- Min: 80,000 ETB ≈ $650 USD
- Max: 85,000 ETB ≈ $690 USD

**1-Bedroom Units:**
- Min: 60,000 ETB ≈ $488 USD
- Max: 65,000 ETB ≈ $528 USD

**Security Deposit:** 20% of total rental cost

---

## Troubleshooting

### PayPal Issues
- **Client ID not found**: Check `.env.local` is in project root
- **Sandbox mode**: Make sure you're testing in PayPal Sandbox first
- **Amount issues**: PayPal expects amounts in 2 decimal places (e.g., 650.00)

### Telebirr Issues
- **API Key rejected**: Verify credentials are correct
- **Phone number validation**: Must include country code (+251 for Ethiopia)
- **Amount format**: Telebirr uses ETB, ensure you're converting from USD correctly

### General Issues
- **Environment variables not loading**: Restart dev server after adding `.env.local`
- **CORS errors**: Make sure API calls go through your backend, not directly to payment provider
- **Payment not processing**: Check console for specific error messages

---

## Security Checklist

- [ ] Never expose API keys in frontend code
- [ ] Use `.env.local` for sensitive credentials
- [ ] Validate all inputs on backend
- [ ] Use HTTPS for all payment endpoints (automatic on Vercel)
- [ ] Verify webhook signatures from payment providers
- [ ] Store minimal payment data (never store full card numbers)
- [ ] Follow PCI compliance guidelines
- [ ] Test with small amounts first

---

## Support

For integration issues:
- **PayPal**: https://developer.paypal.com/docs/
- **Telebirr**: Contact merchant@telebirr.com or visit https://telebirr.com
- **Vercel Environment Variables**: https://vercel.com/docs/environment-variables

---

## Next Steps

1. ✅ Frontend is complete and fully functional
2. ⬜ Add PayPal SDK and implement checkout flow
3. ⬜ Register with Telebirr and get API credentials
4. ⬜ Update API routes with real payment processing
5. ⬜ Add email/WhatsApp notifications
6. ⬜ Test with sandbox credentials
7. ⬜ Deploy to Vercel with production credentials
8. ⬜ Monitor bookings and payments in production
