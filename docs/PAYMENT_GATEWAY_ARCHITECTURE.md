# Payment Gateway Architecture - Production Implementation

## Folder Structure (Production-Ready)

```
modules/payments/
├── payment.model.js              # Master payment schema
├── payment.controller.js         # Payment endpoints
├── payment.service.js            # Generic payment logic
├── payment.routes.js             # Route definitions
├── payment.validator.js          # Validation rules (multi-gateway)
│
├── gateways/                     # Gateway-agnostic structure
│   ├── paymentGateway.js         # Gateway factory/router
│   │
│   ├── razorpay/                 # Razorpay implementation
│   │   ├── razorpay.adapter.js   # API calls to Razorpay
│   │   ├── razorpay.service.js   # Business logic
│   │   ├── razorpay.webhook.js   # Webhook handler
│   │   └── razorpay.routes.js    # (Optional) Gateway-specific routes
│   │
│   ├── paypal/                   # PayPal implementation (TODO)
│   │   ├── paypal.adapter.js
│   │   ├── paypal.service.js
│   │   ├── paypal.webhook.js
│   │   └── paypal.routes.js
│   │
│   └── phonepe/                  # PhonePe implementation (TODO)
│       ├── phonepe.adapter.js
│       ├── phonepe.service.js
│       ├── phonepe.webhook.js
│       └── phonepe.routes.js

webhook/
├── razorpay/
│   └── razorpay.webhook.js       # Routes to gateways/razorpay/razorpay.webhook.js
├── paypal/
│   └── paypal.webhook.js
└── phonepe/
    └── phonepe.webhook.js
```

## Layer Architecture

### Layer 1: Adapters (External API)

**Location:** `modules/payments/gateways/[gateway]/[gateway].adapter.js`

Handles:

- HTTP requests to payment gateway APIs
- Signature verification
- Error handling
- Logging with [Gateway] prefix

Example:

```javascript
// razorpay.adapter.js
const createOrder = async (amount, bookingId) => {
  // Direct API call to Razorpay
  // Returns gateway response
};
```

### Layer 2: Gateway Services

**Location:** `modules/payments/gateways/[gateway]/[gateway].service.js`

Handles:

- Business logic specific to gateway
- Database operations
- Error recovery
- Logging with [Gateway] Service prefix

Example:

```javascript
// razorpay.service.js
const createPaymentOrder = async (userId, bookingId) => {
  // Validates input
  // Calls razorpay.adapter.createOrder()
  // Saves to database
  // Returns payment details
};
```

### Layer 3: Webhook Handlers

**Location:** `modules/payments/gateways/[gateway]/[gateway].webhook.js`

Handles:

- Webhook signature verification
- Event routing
- Database updates
- Orchestration with booking/ticketing

Example:

```javascript
// razorpay.webhook.js
router.post("/events", (req, res) => {
  // Verify signature
  // Route by event type
  // Update payment/booking
  // Call GDS ticketing
});
```

### Layer 4: Gateway Router (Factory Pattern)

**Location:** `modules/payments/gateways/paymentGateway.js`

Handles:

- Dynamic gateway selection
- Lazy loading of gateway modules
- Availability checking
- Centralized configuration

Example:

```javascript
const gateway = paymentGateway.getGateway('razorpay');
const order = await gateway.service.createPaymentOrder(...);
```

### Layer 5: Main Payment Routes

**Location:** `modules/payments/payment.routes.js`

Handles:

- HTTP endpoint definitions
- Gateway dispatch
- Authentication/validation
- Response formatting

Example:

```javascript
// Generic endpoint that works with any gateway
POST /api/v1/payments/create-order
Body: { paymentMethod: 'razorpay', ... }
```

## Payment Flow (End-to-End)

```
1. Frontend requests payment order
   POST /api/v1/payments/create-order
   { paymentMethod: 'razorpay', bookingId: '...', amount: 5000 }

2. payment.controller calls gateway router
   const gateway = paymentGateway.getGateway('razorpay');

3. Gateway router initializes service
   gateway.service.createPaymentOrder(...)

4. Service validates & calls adapter
   adapter.createOrder(...)

5. Adapter calls Razorpay API
   POST https://api.razorpay.com/v1/orders

6. Response → Adapter → Service → Controller → Frontend

7. Frontend shows checkout

8. User pays on Razorpay

9. Razorpay webhooks to /webhook/razorpay/events

10. razorpay.webhook verifies signature & processes

11. Updates Payment + Booking + Tickets
```

## Gateway Interface (Contract)

Every gateway must implement:

```javascript
// adapter.js
module.exports = {
  createOrder(amount, bookingId, customerDetails),
  verifyPaymentSignature(orderId, paymentId, signature),
  getPaymentDetails(paymentId),
  capturePayment(paymentId, amount),
  refundPayment(paymentId, amount, reason),
  // Gateway-specific methods
};

// service.js
module.exports = {
  createPaymentOrder(userId, bookingId, bookingType),
  verifyAndProcessPayment(orderId, paymentId, signature),
  processSuccessfulPayment(paymentId),
  refundPayment(paymentId, amount, reason),
  getPaymentStatus(paymentId),
};

// webhook.js
module.exports = router; // Express router
```

## Adding a New Gateway (e.g., PayPal)

### 1. Create Gateway Folder

```bash
mkdir modules/payments/gateways/paypal
```

### 2. Create adapter.js

```javascript
// paypal.adapter.js
const createOrder = async (amount, bookingId, customerDetails) => {
  // PayPal API calls
  // Signature verification
  // Error handling
};
```

### 3. Create service.js

```javascript
// paypal.service.js
const createPaymentOrder = async (userId, bookingId) => {
  // Validate booking
  // Call paypal.adapter
  // Save to database
};
```

### 4. Create webhook.js

```javascript
// paypal.webhook.js
router.post("/events", (req, res) => {
  // Verify PayPal signature
  // Process events
});
```

### 5. Create routes.js (if gateway-specific)

```javascript
// paypal.routes.js
router.post('/create-order', ...)
router.post('/approve-order', ...)
```

### 6. Register in paymentGateway.js

```javascript
case 'paypal':
  if (!gateway.adapter) {
    gateway.adapter = require('./paypal/paypal.adapter');
    gateway.service = require('./paypal/paypal.service');
    gateway.webhook = require('./paypal/paypal.webhook');
  }
```

### 7. Mount webhook in app.js

```javascript
const paypalWebhook = require("./gateways/paypal/paypal.webhook");
app.use("/webhook/paypal", paypalWebhook);
```

### 8. Update payment.routes.js (if generic endpoints)

```javascript
// Already generic, will automatically work for PayPal
POST /api/v1/payments/create-order
{ paymentMethod: 'paypal', ... }
```

## Configuration (.env)

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx

# PhonePe
PHONEPE_MERCHANT_ID=xxx
PHONEPE_SALT_KEY=xxx
```

## Error Handling Strategy

### Adapter Level

- Network errors → Retry with exponential backoff
- API errors → Log and throw AppError
- Signature failures → Log as security warning

### Service Level

- Validation errors → Throw AppError
- Database errors → Transaction rollback
- External API errors → Pass through

### Controller Level

- Catch all errors
- Log with context
- Return standardized error response

### Webhook Level

- Always return 200 to acknowledge
- Process errors logged for manual retry
- Idempotency keys prevent double-processing

## Security Features

1. **Signature Verification**
   - Every webhook verified with secret key
   - Invalid signatures rejected
   - Prevents spoofing

2. **Ownership Validation**
   - Users can only access their own payments
   - Cross-user access prevented

3. **Idempotency**
   - Webhooks idempotent (safe to retry)
   - Payment processed only once
   - Database transactions ensure atomicity

4. **Rate Limiting**
   - API endpoints rate-limited
   - Webhooks exempt (public)
   - Prevents abuse

5. **Logging & Audit**
   - All transactions logged
   - [Gateway] prefix for traceability
   - Full request/response logged
   - PII logged carefully

## Monitoring & Debugging

### Log Tracing

```
[Razorpay] Creating order for booking: 60d5ec49c123...
[Razorpay] Order created: order_1a2b3c4d...
[Razorpay] Webhook received: payment.captured
[Razorpay] Payment verified: pay_1a2b3c4d...
```

### Payment Status Flow

```
pending → paid → confirmed → ticketed
           ↓
         failed → refunded
```

### Debugging Commands

```bash
# Check payment status
GET /api/v1/payments/razorpay/:paymentId

# Check all payments
db.payments.find({ status: 'paid' })

# Check webhook logs
grep -i "[razorpay]" logs/error.log
grep -i "webhook" logs/app.log
```

## Testing Checklist

- [ ] Razorpay test keys configured
- [ ] Webhook configured in Razorpay dashboard
- [ ] Create order endpoint works
- [ ] Test card payment succeeds
- [ ] Webhook fires and payment updates
- [ ] Booking status updates
- [ ] GDS ticketing calls
- [ ] Refund process works
- [ ] Multiple payment methods work
- [ ] Error scenarios handled
- [ ] Rate limiting works
- [ ] Logging comprehensive

## Production Deployment

1. Update all `.env` with live keys
2. Configure live webhook URLs
3. Set up monitoring/alerts
4. Configure payment reconciliation job
5. Set up payment dispute handling
6. Set up refund approval workflow
7. Test with live test transactions
8. Monitor for errors
9. Set up backup payment gateway
10. Document runbooks

---

**This architecture ensures:**

- ✅ Scalability (easy to add gateways)
- ✅ Maintainability (single responsibility)
- ✅ Testability (mockable layers)
- ✅ Security (signature verification)
- ✅ Reliability (error handling)
- ✅ Observability (comprehensive logging)
