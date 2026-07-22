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
 *     description: Creates a flight booking after a fare quote has been accepted. Requires an authenticated user and a valid fare quote cache entry.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - traceId
 *               - resultIndex
 *               - passengers
 *             properties:
 *               traceId:
 *                 type: string
 *                 example: "1734567890123"
 *               resultIndex:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 example: "11-9273507496_0DELBOM9I11111~4825511490445912"
 *               passengers:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - travellerId
 *                     - isLeadPax
 *                   properties:
 *                     travellerId:
 *                       type: string
 *                       example: "64f0b5c2d2b6e3b4c5d6e7f8"
 *                     isLeadPax:
 *                       type: boolean
 *                       example: true
 *               gstDetails:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   gstNumber:
 *                     type: string
 *                     example: "22AAAAA0000A1Z5"
 *                   companyName:
 *                     type: string
 *                     example: "Example Pvt Ltd"
 *                   address:
 *                     type: string
 *                     example: "123 Main Street"
 *     responses:
 *       201:
 *         description: Booking initiated successfully and payment can proceed.
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
 *                   example: Booking initiated, proceed to payment
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or missing required data.
 *       401:
 *         description: Authentication required.
 *       404:
 *         description: Authenticated user is required or booking not found.
 *       410:
 *         description: Fare quote expired, please re-quote.
 *       500:
 *         description: Internal server error.
 */
router.post('/book', flightValidator.validateResultIndex(), authenticate, validate,   book);

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
