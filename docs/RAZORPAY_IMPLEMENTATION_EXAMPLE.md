# Complete Razorpay Implementation Example

This document shows how to use the Razorpay integration in your flight booking flow.

## Complete Flow Example

### 1. Search Flight (Frontend)

```javascript
// search.js
const searchFlights = async () => {
  const response = await fetch("/api/v1/flights/search", {
    method: "POST",
    body: JSON.stringify({
      origin: "BOM",
      destination: "DEL",
      departDate: "2024-07-15",
      adults: 2,
    }),
  });

  const flights = await response.json();

  // Frontend caches this TraceId
  setTraceId(flights.data[0].traceId);
  setResultIndex(flights.data[0].resultIndex);
  setSrdvIndex(flights.data[0].srdvIndex);
};
```

### 2. Get Fare Quote (Frontend)

```javascript
// flight-details.js
const getFareQuote = async () => {
  const response = await fetch("/api/v1/flights/fare-quote", {
    method: "POST",
    body: JSON.stringify({
      traceId,
      srdvIndex,
      resultIndex,
    }),
  });

  const fareData = await response.json();

  // Store fare details
  setFareData(fareData.data);
};
```

### 3. Backend: Create Booking (After User Enters Traveller Details)

```javascript
// flight.controller.js - Flight booking controller
const bookFlight = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      travellerIds,
      traceId,
      srdvType,
      srdvIndex,
      resultIndex,
      isLCC,
      gstDetails,
    } = req.body;

    // Use booking orchestrator to handle multi-step process
    const bookingOrchestrator = require("../../utils/bookingOrchestrator");

    const flightBooking = await bookingOrchestrator.processFlightBooking(
      userId,
      {
        traceId,
        srdvType,
        srdvIndex,
        resultIndex,
        isLCC,
        travellerIds,
        gstDetails,
      },
    );

    return sendCreated(res, {
      message: "Flight booking created. Proceed to payment.",
      data: flightBooking,
    });
  } catch (error) {
    next(error);
  }
};
```

### 4. Create Payment Order (Frontend → Backend)

```javascript
// checkout.js - React component
const createPaymentOrder = async () => {
  try {
    const response = await fetch("/api/v1/payments/razorpay/create-order", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: booking._id,
        bookingType: "flight",
        amount: booking.totalAmount, // Already includes markup and GST
      }),
    });

    const { data } = await response.json();

    // Save for verification later
    setOrderData(data);

    return data;
  } catch (error) {
    console.error("Payment order creation failed:", error);
  }
};
```

### 5. Show Razorpay Checkout (Frontend)

```javascript
// checkout.js continued
const startCheckout = async () => {
  const orderData = await createPaymentOrder();

  const options = {
    key: orderData.keyId, // Razorpay live key
    amount: orderData.amount * 100, // Convert to paise
    currency: "INR",
    name: "Maqam Travels",
    description: `Flight Booking - PNR: ${booking.pnr}`,
    order_id: orderData.razorpayOrderId,

    prefill: {
      name: orderData.customerDetails.name,
      email: orderData.customerDetails.email,
      contact: orderData.customerDetails.phone,
    },

    // Success callback
    handler: async (paymentResponse) => {
      console.log("Payment successful:", paymentResponse);

      // Verify signature on backend
      const verifyResponse = await verifyPayment(
        orderData.razorpayOrderId,
        paymentResponse.razorpay_payment_id,
        paymentResponse.razorpay_signature,
      );

      if (verifyResponse.success) {
        // Show success page
        showSuccessPage(verifyResponse.data);
      }
    },

    // Failure callback
    modal: {
      ondismiss: () => {
        console.log("Payment cancelled by user");
      },
    },
  };

  const rzp = new Razorpay(options);
  rzp.open();
};

const verifyPayment = async (orderId, paymentId, signature) => {
  const response = await fetch("/api/v1/payments/razorpay/verify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      paymentId,
      signature,
    }),
  });

  return response.json();
};
```

### 6. Backend: Process Successful Payment

When user completes payment, Razorpay sends webhook:

```javascript
// webhook/razorpay/razorpay.webhook.js - Already implemented
// Flow:
// 1. Verify webhook signature (security check)
// 2. Update payment status to 'paid'
// 3. Update booking status to 'confirmed'
// 4. Call SRDV TicketGDS API to issue ticket
// 5. Send email/SMS with PNR + Ticket

// Example webhook payload from Razorpay:
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1a2b3c4d5e6f7g",
        "order_id": "order_1a2b3c4d5e6f7g",
        "amount": 500000,  // in paise
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "email": "john@example.com",
        "contact": "+919876543210"
      }
    }
  }
}
```

### 7. Database Changes

#### Payment Document

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  bookingId: ObjectId("..."),  // Reference to FlightBooking
  bookingType: 'flight',

  // Razorpay fields
  razorpayOrderId: 'order_1a2b3c4d5e6f7g',
  razorpayPaymentId: 'pay_1a2b3c4d5e6f7g',

  amount: 5000,  // in rupees
  currency: 'INR',
  paymentMethod: 'razorpay',

  status: 'paid',  // pending → paid → refunded
  verifiedAt: ISODate("2024-07-04T10:30:00Z"),

  paymentDetails: {
    method: 'card',
    cardLast4: '4111',
    acquirerName: 'hdfc'
  },

  createdAt: ISODate("2024-07-04T10:25:00Z")
}
```

#### Flight Booking Document

```javascript
{
  _id: ObjectId("..."),
  user: ObjectId("..."),

  // Search info
  traceId: 'trace123',
  srdvIndex: '0',
  resultIndex: '0',

  // Booking reference (from SRDV Book API)
  pnr: 'ABC1234',
  srdvBookingId: 12345,

  // Payment info
  razorpayPaymentId: 'pay_1a2b3c4d5e6f7g',
  totalAmount: 5000,
  markupAmount: 500,

  // Status flow
  status: 'confirmed',  // initiated → pending → confirmed → ticketed

  // Ticketing info (after payment)
  ticketStatus: 'OK',
  passengers: [
    {
      travellerId: ObjectId("..."),
      isLeadPax: true,
      ticketNumber: '0012345678901',  // Filled after TicketGDS
      ticketStatus: 'OK'
    }
  ],

  createdAt: ISODate("2024-07-04T10:20:00Z")
}
```

## Testing Scenarios

### Scenario 1: Successful Payment

```bash
# 1. Search flight (returns traceId)
curl -X POST http://localhost:5000/api/v1/flights/search \
  -H "Content-Type: application/json" \
  -d '{"origin":"BOM","destination":"DEL","departDate":"2024-07-15"}'

# 2. Get fare quote (caches fare)
curl -X POST http://localhost:5000/api/v1/flights/fare-quote \
  -H "Authorization: Bearer <token>" \
  -d '{"traceId":"trace123","srdvIndex":"0","resultIndex":"0"}'

# 3. Create booking
curl -X POST http://localhost:5000/api/v1/flights/book \
  -H "Authorization: Bearer <token>" \
  -d '{
    "travellerIds":["traveller1","traveller2"],
    "traceId":"trace123",
    "srdvType":"SRDV"
  }'
# Response: { pnr: "ABC1234", status: "pending", ... }

# 4. Create payment order
curl -X POST http://localhost:5000/api/v1/payments/razorpay/create-order \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bookingId":"booking_id",
    "bookingType":"flight",
    "amount":5000
  }'
# Response: { razorpayOrderId: "order_123", keyId: "rzp_test_...", ... }

# 5. User pays via Razorpay (in frontend)
# Razorpay sends webhook automatically

# 6. Check booking status
curl -X GET http://localhost:5000/api/v1/flights/booking_id \
  -H "Authorization: Bearer <token>"
# Response: { status: "confirmed", ticketNumber: "0012345678901", ... }
```

### Scenario 2: Test Webhook

Use Razorpay dashboard webhook debugger:

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test123",
        "order_id": "order_test123",
        "amount": 500000,
        "status": "captured"
      }
    }
  }
}
```

### Scenario 3: Handle Failed Payment

```javascript
// In frontend, if user closes checkout or payment fails
// Can retry by creating a new order (old order not affected)

const retryPayment = async () => {
  // Create new order
  const newOrderData = await createPaymentOrder();

  // Show checkout again
  startCheckout();
};
```

## Monitoring

### Check Payment Status

```bash
curl -X GET http://localhost:5000/api/v1/payments/razorpay/payment_id \
  -H "Authorization: Bearer <token>"

# Response shows:
# - Payment status (paid/failed/refunded)
# - Booking status (confirmed/ticketed/cancelled)
# - When verified
# - Transaction details
```

### Check Razorpay Dashboard

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Payments → See all transactions
3. Click payment → See full details
4. Refunds → See refund history

### Monitor Webhooks

1. Settings → Webhooks → Your webhook
2. See delivery attempts
3. If failed, retry manually
4. Check response status codes

## Error Recovery

### Payment shows "pending" after 10 minutes

```javascript
// Manually verify
const payment = await Payment.findOne({ razorpayOrderId });

if (!payment.razorpayPaymentId) {
  // Webhook never fired
  // Manually call verify endpoint:
  const verifyResponse = await fetch('/api/v1/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify({
      orderId: payment.razorpayOrderId,
      paymentId: /* get from Razorpay dashboard */,
      signature: /* get from dashboard */
    })
  });
}
```

### SRDV TicketGDS fails after payment

```javascript
// Booking is confirmed, ticket not issued
// Manual action:

// 1. Check booking status
const booking = await FlightBooking.findById(bookingId);
console.log(booking.status); // should be "confirmed"
console.log(booking.pnr); // should have PNR

// 2. Retry ticketing manually
const ticketingResult = await bookingOrchestrator.processTicketing(bookingId);

// 3. Send notification manually
// await sendTicketEmail(booking);
```

## Environment Configuration

```env
# .env

# Razorpay Live Keys (after testing)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Webhook
RAZORPAY_WEBHOOK_URL=https://maqamtravels.com/webhook/razorpay/events

# SRDV (for booking & ticketing)
SRDV_BASE_URL=https://api.srdv.com
SRDV_API_KEY=xxxxxxxxxxxxx

# Notifications (for confirmation email/SMS)
SENDGRID_API_KEY=xxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=xxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

This completes the Razorpay integration!
