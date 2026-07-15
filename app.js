require('dotenv').config();
require('express-async-errors'); 

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');

const { apiLimiter }   = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const logger           = require('./utils/logger');

// ─── Module Route imports─────────────────
const authRoutes    = require('./modules/auth/auth.routes');
const hotelRoutes   = require('./modules/hotels/hotel.routes');
const flightRoutes  = require('./modules/flights/flight.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const tourRoutes    = require('./modules/tours/tour.routes');
const {admin : adminPackageRoutes, customer : userPackageRoutes} = require('./modules/packages/package.routes');
const paymentRoutes = require('./modules/payments/payment.routes');
const accountRoutes = require('./modules/account/account.routes');
const cmsRoutes     = require('./modules/cms/cms.routes');
const crmRoutes     = require('./modules/crm/crm.routes');

// SWAGGER SETUP
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDocument = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travel Booking API',
      version: '1.0.0',
      description: 'API documentation for the Travel Booking platform',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local development server' },
    ],
    tags: [
      { name: 'Health', description: 'Health and status endpoints' },
      { name: 'Auth', description: 'Authentication and account access' },
      { name: 'Flights', description: 'Flight search, fares, and booking' },
      { name: 'Bookings', description: 'Booking lifecycle operations' },
    ],
  },
  apis: ['./app.js', './modules/**/*.js'],
});

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
    env:    process.env.NODE_ENV,
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
app.use('/api/v1/tours',    tourRoutes);
// app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/admin/packages', adminPackageRoutes);
app.use('/api/v1/user/packages', userPackageRoutes);
app.use('/api/v1/account',  accountRoutes);
app.use('/api/v1/cms',      cmsRoutes);

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
