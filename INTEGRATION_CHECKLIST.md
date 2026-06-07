# Quick Reference: Payment Integration Checklist

## What's Already Built ✅

### Frontend (Complete)
- [x] Responsive website with hero, units, amenities, building layout
- [x] Booking modal with multi-step form
- [x] Pricing display (USD + ETB with live calculation)
- [x] Security deposit calculation (20%)
- [x] Payment method selection (PayPal + Telebirr)
- [x] Form validation with error messages
- [x] Confirmation screen
- [x] Enhanced aesthetics with gradients, animations, shadows

### Files Created
- `app/page.tsx` - Main website
- `components/booking-modal.tsx` - Booking form
- `app/api/payments/route.ts` - Payment API placeholder
- `PAYMENT_SETUP.md` - Detailed setup guide

---

## What You Need to Do ⚠️

### Step 1: Get API Credentials (15 mins)

**PayPal:**
1. Go to https://developer.paypal.com
2. Sign up and verify email
3. In Apps & Credentials → Sandbox → Get Client ID
4. Add to `.env.local`: `NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_id`

**Telebirr:**
1. Go to https://telebirr.com/merchants
2. Register as merchant
3. Complete KYC verification
4. Get Merchant ID and API Key
5. Add to `.env.local`:
   - `TELEBIRR_MERCHANT_ID=your_id`
   - `TELEBIRR_API_KEY=your_key`

### Step 2: Implement Payment Processing (1-2 hours)

Update `app/api/payments/route.ts` to actually process payments:

**For PayPal:**
```bash
npm install paypal-rest-sdk
```
Then implement PayPal API calls in the route handler.

**For Telebirr:**
Implement HTTP POST requests to Telebirr API endpoints.

### Step 3: Update Modal Component (30 mins)

In `components/booking-modal.tsx`, update `handlePaymentSubmit()` to:
1. Call `/api/payments` endpoint
2. Redirect to payment gateway or show payment UI
3. Handle payment success/failure responses

### Step 4: Add Webhooks for Callbacks (1 hour)

Create these new files:
- `app/api/webhooks/paypal/route.ts` - Verify PayPal payments
- `app/api/webhooks/telebirr/route.ts` - Verify Telebirr payments

### Step 5: Email & Notifications (Optional, 30 mins)

Send booking confirmations via:
- Email (Resend, SendGrid, or any email service)
- WhatsApp (Twilio)

---

## Testing Checklist

- [ ] Test with PayPal Sandbox credentials
- [ ] Test with Telebirr test environment
- [ ] Fill out booking form completely
- [ ] Verify pricing calculations are correct
- [ ] Test both payment methods
- [ ] Check confirmation email is sent
- [ ] Verify webhook responses are processed

---

## Environment Variables Template

Create `.env.local` in project root:

```bash
# PayPal (get from developer.paypal.com)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# Telebirr (get from telebirr.com merchant portal)
TELEBIRR_MERCHANT_ID=your_merchant_id
TELEBIRR_API_KEY=your_api_key

# Optional - for notifications
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# For deployment to Vercel
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Pricing Info

2-Bedroom:
- ETB: 80,000 - 85,000
- USD: $650 - $690
- Security Deposit (20%): $130 - $138

1-Bedroom:
- ETB: 60,000 - 65,000
- USD: $488 - $528
- Security Deposit (20%): $98 - $106

---

## Key API Endpoints to Implement

### Create Payment
```
POST /api/payments
Body: {
  bookingData: {...},
  paymentMethod: "paypal" | "telebirr",
  totalAmount: number
}
```

### PayPal Webhook
```
POST /api/webhooks/paypal
Body: {Webhook event from PayPal}
```

### Telebirr Webhook
```
POST /api/webhooks/telebirr
Body: {Webhook event from Telebirr}
```

---

## Deployment to Vercel

```bash
# 1. Push code to GitHub
git add .
git commit -m "Add booking and payment features"
git push origin main

# 2. Add env vars in Vercel dashboard
# Project Settings → Environment Variables
# Add: NEXT_PUBLIC_PAYPAL_CLIENT_ID, TELEBIRR_MERCHANT_ID, TELEBIRR_API_KEY

# 3. Redeploy
vercel deploy --prod
```

---

## Support Resources

- PayPal Docs: https://developer.paypal.com/docs/
- Telebirr API: Contact merchant@telebirr.com
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "NEXT_PUBLIC_PAYPAL_CLIENT_ID is undefined" | Add to `.env.local` and restart dev server |
| Modal doesn't open | Check browser console for errors |
| Payment amount wrong | Verify duration field is filled (used in calculation) |
| Telebirr phone validation fails | Ensure phone has +251 country code |
| Webhook not processing | Check firewall rules allow POST from payment provider IPs |

---

## Next Meeting Checklist

Before your next meeting with the integrations team:
- [ ] API credentials obtained
- [ ] Payment processing implemented
- [ ] Tested with test credentials
- [ ] Webhooks handling verified
- [ ] Email confirmations working
- [ ] Ready for production deployment

---

**Status**: Frontend 100% Complete • Backend 10% Complete
