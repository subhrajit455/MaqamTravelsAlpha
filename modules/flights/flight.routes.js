const router = require('express').Router();
const  {
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
 *     tags:
 *       - Flights
 *     summary: Search available flights
 *     description: Searches flights based on the provided travel details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - departureDate
 *             properties:
 *               origin:
 *                 type: string
 *                 description: IATA airport code of the departure airport.
 *                 example: DEL
 *               destination:
 *                 type: string
 *                 description: IATA airport code of the destination airport.
 *                 example: BOM
 *               departureDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-08-15"
 *               returnDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2026-08-20"
 *               passengers:
 *                 type: object
 *                 properties:
 *                   adults:
 *                     type: integer
 *                     minimum: 1
 *                     example: 1
 *                   children:
 *                     type: integer
 *                     minimum: 0
 *                     example: 0
 *                   infants:
 *                     type: integer
 *                     minimum: 0
 *                     example: 0
 *               journeyType:
 *                 type: string
 *                 enum:
 *                   - oneway
 *                   - roundtrip
 *                 default: oneway
 *                 example: oneway
 *     responses:
 *       200:
 *         description: Flights found successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Flights found
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request data.
 *       500:
 *         description: Internal server error.
 */
router.post('/search', searchLimiter, flightValidator.validateSearch(), validate, searchFlights);

/**
 * @openapi
 * /api/v1/flights/farequote:
 *   post:
 *     tags: [Flights]
 *     summary: Get a fare quote for a flight with cached details and resultIndex from FE
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               traceId:
 *                 type: integer
 *                 example: 2432123
 *               resultIndex:
 *                 type: string
 *                 example: "11-9273507496_0DELBOM9I11111~4825511490445912"
 *     responses:
 *       200:
 *         description: Fare quote or Flight Details returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: xyz
 *                 data:
 *                   type: object
 */
router.post('/farequote', flightValidator.validateResultIndex(), validate,  getFareQuote);

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
router.post('/book', flightValidator.validateResultIndex(), validate, authenticate,  book);

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
