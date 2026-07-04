# Razorpay Integration Guide

## Overview

This guide explains the complete Razorpay payment integration for your flight booking system.

## Architecture

```
Flight Booking Flow:
1. User searches flights → TraceId stored
2. User selects flight → FareQuote API
3. User enters traveller details
4. Backend calls SRDV Book API → PNR created
5. Payment Order Created (Razorpay)
6. Frontend shows Razorpay Checkout
7. User pays
8. Razorpay sends webhook
9. Webhook processes payment & tickets
```

## File Structure

```
providers/razorpay/
  ├── razorpay.adapter.js      # Low-level API calls
  └── razorpay.client.js       # Client interface

modules/payments/
  ├── payment.model.js         # Payment schema with Razorpay fields
  ├── payment.validator.js     # Endpoint validators
  ├── razorpay.service.js      # Business logic
  ├── razorpay.controller.js   # Endpoints
  └── payment.routes.js        # Route definitions

webhook/razorpay/
  └── razorpay.webhook.js      # Webhook handler

utils/
  ├── fareCache.js             # Cache search results
  ├── bookingOrchestrator.js   # Booking multi-step flow
  └── paymentOrchestrator.js   # Payment multi-step flow
```

## Setup Steps

### 1. Environment Variables

Add to `.env`:

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx

# Webhook (used by Razorpay to call your server)
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_URL=https://yourdomain.com/webhook/razorpay/events
```

**Get credentials:**

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings → API Keys → Copy Test Mode keys first
3. Save to `.env`

### 2. Webhook Configuration

**In Razorpay Dashboard:**

1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/webhook/razorpay/events`
3. Select events:
   - `payment.authorized`
   - `payment.captured` (IMPORTANT - when money is taken)
   - `payment.failed`
   - `refund.created`
4. Click Create
5. Copy webhook secret to `.env` as `RAZORPAY_WEBHOOK_SECRET`

## API Endpoints

### 1. Create Payment Order

```http
POST /api/v1/payments/razorpay/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "60d5ec49c1234567890abc12",
  "bookingType": "flight",
  "amount": 5000
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment order created successfully",
  "data": {
    "paymentId": "60d5ec49c1234567890abc12",
    "razorpayOrderId": "order_1a2b3c4d5e6f7g",
    "amount": 5000,
    "currency": "INR",
    "keyId": "rzp_test_xxxxx",
    "bookingId": "60d5ec49c1234567890abc12",
    "bookingType": "flight",
    "customerDetails": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210"
    }
  }
}
```

### 2. Verify Payment (Frontend calls after checkout)

```http
POST /api/v1/payments/razorpay/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_1a2b3c4d5e6f7g",
  "paymentId": "pay_1a2b3c4d5e6f7g",
  "signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified and processed successfully",
  "data": {
    "success": true,
    "paymentId": "60d5ec49c1234567890abc12",
    "bookingId": "60d5ec49c1234567890abc12",
    "status": "confirmed",
    "pnr": "ABC1234"
  }
}
```

### 3. Get Payment Status

```http
GET /api/v1/payments/razorpay/60d5ec49c1234567890abc12
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Payment status retrieved",
  "data": {
    "paymentId": "60d5ec49c1234567890abc12",
    "razorpayOrderId": "order_1a2b3c4d5e6f7g",
    "razorpayPaymentId": "pay_1a2b3c4d5e6f7g",
    "amount": 5000,
    "status": "paid",
    "bookingStatus": "confirmed",
    "verifiedAt": "2024-07-04T10:30:00Z",
    "createdAt": "2024-07-04T10:25:00Z"
  }
}
```

### 4. Refund Payment

```http
POST /api/v1/payments/razorpay/60d5ec49c1234567890abc12/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "reason": "Booking cancelled by customer"
}
```

## Frontend Integration

### 1. Create Order & Get Razorpay Credentials

```javascript
// 1. Create order (get Razorpay key and order ID)
const response = await fetch("/api/v1/payments/razorpay/create-order", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    bookingId: booking._id,
    bookingType: "flight",
    amount: booking.totalAmount,
  }),
});

const { data } = await response.json();
const { razorpayOrderId, keyId, amount, customerDetails } = data;
```

### 2. Show Razorpay Checkout

```javascript
// 2. Show Razorpay checkout
const options = {
  key: keyId, // From response
  amount: amount * 100, // Convert to paise
  currency: "INR",
  name: "Maqam Travels",
  description: "Flight Booking",
  order_id: razorpayOrderId,
  prefill: {
    name: customerDetails.name,
    email: customerDetails.email,
    contact: customerDetails.phone,
  },
  handler: async (response) => {
    // 3. Verify payment on server
    const verifyResponse = await fetch("/api/v1/payments/razorpay/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: razorpayOrderId,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      }),
    });

    const { data } = await verifyResponse.json();

    if (data.success) {
      // Show success message
      alert("Payment successful! Booking confirmed.");
      // Redirect to booking details
    }
  },
  theme: {
    color: "#3399cc",
  },
};

const rzp = new Razorpay(options);
rzp.open();
```

### 3. Include Razorpay Script

In your HTML `<head>`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Webhook Flow

### Event: payment.captured

When user pays successfully:

1. **Razorpay** sends webhook POST to `/webhook/razorpay/events`
2. **Server** verifies signature
3. **Server** updates payment status to 'paid'
4. **Server** updates booking status to 'confirmed'
5. **Server** calls SRDV TicketGDS API → Issues ticket
6. **Server** sends email/SMS with PNR + Ticket

## Payment Statuses

| Status     | Meaning                         | Action                      |
| ---------- | ------------------------------- | --------------------------- |
| `pending`  | Order created, awaiting payment | User at checkout            |
| `paid`     | Payment captured                | Process booking + ticket    |
| `failed`   | Payment declined                | Show error, offer retry     |
| `refunded` | Full refund processed           | Update booking to cancelled |

## Booking Statuses

| Status      | Meaning           | Next Step                        |
| ----------- | ----------------- | -------------------------------- |
| `initiated` | Created in system | User enters details              |
| `pending`   | SRDV PNR created  | User pays (create payment order) |
| `confirmed` | Payment received  | GDS ticketing                    |
| `ticketed`  | Ticket issued     | Send to customer                 |
| `cancelled` | Booking cancelled | Process refund                   |

## Error Handling

### Common Errors

1. **Invalid Signature**
   - Webhook signature didn't match
   - Check `RAZORPAY_KEY_SECRET` in `.env`

2. **Payment Not Found**
   - Order/payment ID not in database
   - Check payment.model.js indexes

3. **SRDV Ticketing Failed**
   - Airline API failed after payment
   - Stored in logs for manual retry
   - User gets partial confirmation (PNR but no ticket)

## Testing

### Test Card Numbers

```
Visa:          4111 1111 1111 1111
Mastercard:    5555 5555 5555 4444
Amex:          3782 822463 10005
```

Any future date and any CVV will work in test mode.

### Test Webhook

Use Razorpay webhook debugger in dashboard to test webhook handling.

## Production Checklist

- [ ] Switch to Live API keys in `.env`
- [ ] Configure live webhook URL in Razorpay dashboard
- [ ] Test end-to-end payment flow
- [ ] Set up error monitoring/logging
- [ ] Implement email notifications
- [ ] Test refund flow
- [ ] Set up payment reconciliation
- [ ] Inform customer support team about payment process

## Troubleshooting

### Payment shows pending after long time

Check webhook logs - webhook might not have fired.

Solution:

```javascript
// Manual verification
GET /api/v1/payments/razorpay/:paymentId
```

### SRDV ticketing fails after payment

Booking is confirmed but ticket not issued. Manual action needed.

Check logs:

```
logs/error.log → Search for "TicketGDS"
```

### Refund not processing

Check `razorpayPaymentId` is correctly stored.

```javascript
// Debug
db.payments.findOne({ _id: ObjectId("...") });
// Check razorpayPaymentId field
```

## References

- [Razorpay Documentation](https://razorpay.com/docs)
- [Razorpay API Reference](https://razorpay.com/docs/api)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-mode)
