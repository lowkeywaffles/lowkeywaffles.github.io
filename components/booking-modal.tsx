'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Phone number must be valid'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 month').max(36, 'Duration cannot exceed 36 months'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['paypal', 'telebirr'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: '2br' | '1br';
  roomName: string;
}

const PRICES = {
  '2br': { etb: { min: 80000, max: 85000 }, usd: { min: 650, max: 690 } },
  '1br': { etb: { min: 60000, max: 65000 }, usd: { min: 488, max: 528 } },
};

const SECURITY_DEPOSIT_PERCENT = 0.2;

export default function BookingModal({
  isOpen,
  onClose,
  roomType,
  roomName,
}: BookingModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'confirmation'>(
    'details'
  );
  const [selectedPrice, setSelectedPrice] = useState<'min' | 'max'>('min');
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'telebirr' | null>(null);
  const [telebirrProof, setTelebirrProof] = useState<File | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const duration = watch('duration');
  const selectedPaymentMethod = watch('paymentMethod');
  const price = PRICES[roomType];
  const selectedPriceValue =
    selectedPrice === 'min' ? price.usd.min : price.usd.max;
  const durationNum = typeof duration === 'string' ? parseInt(duration) : duration || 1;
  const totalCost = selectedPriceValue * durationNum;
  const securityDeposit = Math.round(totalCost * SECURITY_DEPOSIT_PERCENT);
  const totalAmount = totalCost + securityDeposit;

  const onSubmit = (data: BookingFormData) => {
    console.log("[v0] Form submitted:", data);
    if (!data.paymentMethod) {
      console.log("[v0] No payment method selected");
      return;
    }
    setBookingData(data);
    setPaymentMethod(data.paymentMethod as 'paypal' | 'telebirr');
    setStep('payment');
  };

  const handlePayPalPayment = async () => {
    if (!bookingData) return;

    setStep('processing');
    setProcessingMessage('Redirecting to PayPal...');

    try {
      // Initialize PayPal
      if (typeof window !== 'undefined' && !(window as any).paypal) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}`;
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
          (window as any).paypal.Buttons({
            createOrder: async (data: any, actions: any) => {
              return await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  method: 'paypal',
                  amount: totalAmount,
                  currency: 'USD',
                  bookingData,
                }),
              })
                .then((res) => res.json())
                .then((data) => data.orderID);
            },
            onApprove: async (data: any, actions: any) => {
              setProcessingMessage('Completing payment...');
              return await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  method: 'paypal-capture',
                  orderID: data.orderID,
                  bookingData,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    setStep('confirmation');
                  }
                });
            },
            onError: (err: any) => {
              setProcessingMessage('Payment failed. Please try again.');
              console.error('PayPal error:', err);
            },
          }).render('#paypal-container');
        };
      }
    } catch (error) {
      console.error('Error setting up PayPal:', error);
      setProcessingMessage('Error setting up payment. Please try again.');
    }
  };

  const handleTelebirrPayment = async () => {
    if (!telebirrProof) {
      alert('Please upload proof of payment');
      return;
    }

    setStep('processing');
    setProcessingMessage('Processing your Telebirr payment proof...');

    try {
      const formData = new FormData();
      formData.append('method', 'telebirr');
      formData.append('amount', totalAmount.toString());
      formData.append('proof', telebirrProof);
      formData.append('bookingData', JSON.stringify(bookingData));

      const response = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStep('confirmation');
      } else {
        setProcessingMessage(data.message || 'Payment processing failed');
        setStep('payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setProcessingMessage('Error processing payment. Please try again.');
      setStep('payment');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary p-6 text-primary-foreground sticky top-0">
          <button
            onClick={onClose}
            className="float-right text-lg hover:opacity-80 transition"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold mb-1">{roomName}</h2>
          <p className="text-sm opacity-90">Complete your booking</p>
        </div>

        <div className="p-6">
          {/* Step Indicators */}
          <div className="flex gap-2 mb-8">
            {['details', 'payment', 'processing', 'confirmation'].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition ${
                  i < ['details', 'payment', 'processing', 'confirmation'].indexOf(step)
                    ? 'bg-primary'
                    : step === s
                      ? 'bg-primary'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Details Step */}
          {step === 'details' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  {...register('name')}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="+251 911 654 766"
                  className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errors.phone && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Check-in Date
                  </label>
                  <input
                    {...register('checkInDate')}
                    type="text"
                    placeholder="MM/DD/YYYY"
                    className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.checkInDate && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.checkInDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (months)
                  </label>
                  <input
                    {...register('duration', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="36"
                    placeholder="1"
                    className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.duration && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Any special requests..."
                  rows={3}
                  className="w-full px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/30">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value="paypal"
                      className="w-4 h-4"
                    />
                    <span className="text-sm">PayPal</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/30">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value="telebirr"
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Telebirr</span>
                  </label>
                </div>
                {errors.paymentMethod && (
                  <p className="text-destructive text-sm">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105"
              >
                Continue to Payment
              </button>
            </form>
          )}

          {/* Payment Step */}
          {step === 'payment' && bookingData && (
            <div className="space-y-6">
              {/* Price Breakdown */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monthly Rate:</span>
                    <span>${selectedPriceValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{durationNum} month{durationNum !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-2">
                    <span>Subtotal:</span>
                    <span>${totalCost}</span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span>Security Deposit (20%):</span>
                    <span>${securityDeposit}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2 text-primary">
                    <span>Total Due:</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">
                  Select Payment Method
                </h3>

                {/* PayPal Option */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedPaymentMethod === 'paypal'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}>
                  <input
                    {...register('paymentMethod')}
                    type="radio"
                    value="paypal"
                    className="w-5 h-5 accent-primary"
                  />
                  <div>
                    <div className="font-semibold">PayPal</div>
                    <div className="text-sm text-muted-foreground">
                      International payments - Secure & Fast
                    </div>
                  </div>
                </label>

                {/* Telebirr Option */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedPaymentMethod === 'telebirr'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}>
                  <input
                    {...register('paymentMethod')}
                    type="radio"
                    value="telebirr"
                    className="w-5 h-5 accent-primary"
                  />
                  <div>
                    <div className="font-semibold">Telebirr</div>
                    <div className="text-sm text-muted-foreground">
                      Ethiopian payment (ETB) - Scan & Upload Proof
                    </div>
                  </div>
                </label>

                {errors.paymentMethod && (
                  <p className="text-destructive text-sm">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>

              {/* Telebirr Proof Upload */}
              {selectedPaymentMethod === 'telebirr' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">
                      Telebirr Payment Instructions
                    </h4>
                    <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                      <li>Scan the Telebirr QR code with your phone</li>
                      <li>Send ETB {Math.round((totalAmount * 125))} ({totalAmount} USD equivalent)</li>
                      <li>Take a screenshot of the transaction confirmation</li>
                      <li>Upload the screenshot below</li>
                    </ol>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Upload Payment Proof
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTelebirrProof(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full p-3 border-2 border-dashed rounded-lg text-center transition ${
                        telebirrProof
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-amber-300 hover:border-amber-400'
                      }`}
                    >
                      {telebirrProof ? (
                        <div className="text-sm">
                          <div className="font-semibold">✓ File Selected</div>
                          <div className="text-xs">{telebirrProof.name}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl mb-1">📸</div>
                          <div className="text-sm">Click to upload screenshot</div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('details')}
                  className="flex-1 bg-muted text-foreground py-3 rounded-lg font-semibold hover:opacity-80 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (selectedPaymentMethod === 'paypal') {
                      handlePayPalPayment();
                    } else if (selectedPaymentMethod === 'telebirr') {
                      handleTelebirrPayment();
                    }
                  }}
                  disabled={selectedPaymentMethod === 'telebirr' && !telebirrProof}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Payment
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin text-5xl">⚙️</div>
              <h3 className="text-xl font-bold">{processingMessage}</h3>
              <p className="text-muted-foreground">
                Please wait while we process your payment...
              </p>
              <div id="paypal-container" className="mt-4" />
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirmation' && bookingData && (
            <div className="space-y-4 text-center py-4">
              <div className="text-6xl mb-4 animate-pulse">✓</div>
              <h3 className="text-2xl font-bold text-primary">
                Booking Confirmed!
              </h3>
              <p className="text-muted-foreground">
                Thank you for booking with Maranatha Apartments!
              </p>
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guest:</span>
                  <span className="font-semibold">{bookingData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span className="font-semibold">{bookingData.checkInDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">
                    {bookingData.duration} month{bookingData.duration !== '1' ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-semibold">{roomType === '2br' ? '2 Bedroom' : '1 Bedroom'}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-primary">${totalAmount}</span>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                A confirmation email has been sent to <span className="font-semibold">{bookingData.email}</span>. We&apos;ll contact you at <span className="font-semibold">{bookingData.phone}</span> shortly.
              </div>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition transform hover:scale-105"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
