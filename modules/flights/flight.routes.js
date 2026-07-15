const router = require('express').Router();
<<<<<<< HEAD
const  {
=======
const {
>>>>>>> 204c8b51f9176295a728cea037af26b59d540007
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
<<<<<<< HEAD
router.post('/farequote', flightValidator.validateFlightId(), validate,  getFareQuote);
=======
router.post('/farequote', flightValidator.validateFlightId(), validate, getFareQuote);
>>>>>>> 204c8b51f9176295a728cea037af26b59d540007

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
<<<<<<< HEAD
router.post('/book', flightValidator.validateFlightId(), validate, authenticate,  book);
=======
router.post('/book', flightValidator.validateFlightId(), validate, authenticate, book);
>>>>>>> 204c8b51f9176295a728cea037af26b59d540007

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
