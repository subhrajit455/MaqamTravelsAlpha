require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const correlationIdMiddleware = require('./middleware/correlationId');

// ─── Module Route imports─────────────────
const authRoutes    = require('./modules/auth/auth.routes');
const hotelRoutes   = require('./modules/hotels/hotel.routes');
const flightRoutes  = require('./modules/flights/flight.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const tourRoutes = require('./modules/tours/tour.routes');
const packageRoutes = require('./modules/packages/package.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const accountRoutes = require('./modules/account/account.routes');
const cmsRoutes = require('./modules/cms/cms.routes');
const crmRoutes = require('./modules/crm/crm.routes');

// ─── Webhook Routes (public, no auth required) ────────────
const razorpayWebhook = require('./webhook/razorpay/razorpay.webhook');
const paypalWebhook = require('./modules/payments/gateways/paypal/paypal.webhook');
const phonepeWebhook = require('./modules/payments/gateways/phonepe/phonepe.webhook');

// SWAGGER SETUP
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger');


const app = express();

app.use(correlationIdMiddleware);

app.use(cors({
  origin: [
    'http://192.168.0.123:5173', // For network access
    'http://localhost:5173',
  ],
  credentials: true,
}));

// Force handle preflight requests globally
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Configure parser to preserve raw request bodies for webhook verification checks
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Webhook Routes (BEFORE rate limiter, NO auth required) ─────
// Webhooks need to be outside rate limiting
app.use('/webhook/razorpay', razorpayWebhook);
app.use('/webhook/paypal', paypalWebhook);
app.use('/webhook/phonepe', phonepeWebhook);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

app.use('/api', apiLimiter);

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check server health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 env:
 *                   type: string
 *                 uptime:
 *                   type: number
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

//swagger setup
app.set('swaggerDocument', swaggerDocument);
app.get('/api/docs.json', (_req, res) => {
  res.json(swaggerDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/hotels',   hotelRoutes);
app.use('/api/v1/flights',  flightRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/cms', cmsRoutes);

// ─── PayPal Redirect Landing Pages ─────────────────────────
// When no SPA frontend is available, the backend can still render a lightweight status page.
app.get('/payment/paypal/success', (req, res) => {
  const { token, PayerID, bookingId } = req.query;
  const orderId = token || req.query.orderId || '';

  return res.status(200).send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>PayPal Payment Success</title></head>
<body>
  <h1>PayPal Redirect Successful</h1>
  <p>Booking ID: ${bookingId || 'N/A'}</p>
  <p>Order ID: ${orderId || 'N/A'}</p>
  <p>To complete the payment capture, call <code>POST /api/v1/payments/paypal/capture</code> with <code>{ "orderId": "${orderId}" }</code> from an authenticated client.</p>
</body>
</html>`);
});

app.get('/payment/paypal/cancel', (req, res) => {
  const { bookingId } = req.query;
  return res.status(200).send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>PayPal Payment Cancelled</title></head>
<body>
  <h1>PayPal Payment Cancelled</h1>
  <p>Booking ID: ${bookingId || 'N/A'}</p>
  <p>The PayPal checkout was cancelled. You may retry payment from your booking page.</p>
</body>
</html>`);
});

// ─── CRM Routes (prefix-gated — mounts only when slug matches) ──
// The actual CRM route file checks the prefix at the middleware level too
// so even if someone guesses the URL, they still need the right role
const CRM_PREFIX = process.env.CRM_PREFIX || '/ops-crm';
app.use(`/api/v1${CRM_PREFIX}`, crmRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


// ─── Global Error Handler (must be last) ──────────────────
app.use(errorHandler);

module.exports = app;
