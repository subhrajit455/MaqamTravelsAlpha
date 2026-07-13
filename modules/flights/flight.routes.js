const router = require('express').Router();
const {
  searchFlights,
  getFareQuote,
  book
} = require('./flight.controller');
const flightValidator = require('./flight.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');
const { authenticate } = require('../../middleware/auth');
/**
 * @openapi
 * /api/v1/flights/search:
 *   post:
 *     tags: [Flights]
 *     summary: Search flights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               departureDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Search results returned successfully
 */
router.post('/search', searchLimiter, flightValidator.validateSearch(), validate, searchFlights);

/**
 * @openapi
 * /api/v1/flights/farequote:
 *   post:
 *     tags: [Flights]
 *     summary: Get a fare quote for a flight
 *     responses:
 *       200:
 *         description: Fare quote returned successfully
 */
router.post('/farequote', flightValidator.validateFlightId(), validate, getFareQuote);

/**
 * @openapi
 * /api/v1/flights/book:
 *   post:
 *     tags: [Flights]
 *     summary: Book a selected flight
 *     responses:
 *       200:
 *         description: Booking created successfully
 */
router.post('/book', flightValidator.validateFlightId(), validate, authenticate, book);

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
