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

// ─── Module Route imports (new structure) ─────────────────
const authRoutes = require('./modules/auth/auth.routes');
const hotelRoutes = require('./modules/hotels/hotel.routes');
const flightRoutes = require('./modules/flights/flight.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const tourRoutes = require('./modules/tours/tour.routes');
const packageRoutes = require('./modules/packages/package.routes');
const paymentRoutes = require("./modules/payments/payment.routes");
const accountRoutes = require('./modules/account/account.routes');
const cmsRoutes = require('./modules/cms/cms.routes');
const crmRoutes = require('./modules/crm/crm.routes');

// ─── Webhook Routes (public, no auth required) ────────────
const razorpayWebhook = require('./webhook/razorpay/razorpay.webhook');

const app = express();
app.use(cors({
  origin: [

    "http://192.168.0.123:5173", // For network access
    "http://localhost:5173"
  ],
  credentials: true,
}));
// Force handle preflight requests globally
app.options('*', cors());

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Webhook Routes (BEFORE rate limiter, NO auth required) ─────
// Webhooks need to be outside rate limiting
app.use('/webhook', razorpayWebhook);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    uptime: process.uptime(),
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/hotels', hotelRoutes);
app.use('/api/v1/flights', flightRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/tours', tourRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/cms', cmsRoutes);

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
