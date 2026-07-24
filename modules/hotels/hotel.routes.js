const router = require('express').Router();
const controller = require('./hotel.controller');
const validator = require('./hotel.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');
const { query } = require('express-validator');
const { authenticate } = require('../../middleware/auth');
const idempotency = require('../payments/idempotency.middleware');

/**
 * @openapi
 * /api/v1/hotels/search:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Search hotels
 *     description: Search hotel availability using normalized criteria. Returns an opaque searchId for later detail and recheck calls. Include an admin Bearer JWT in Swagger to see full supplier and markup pricing fields.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelSearchRequest'
 *     responses:
 *       200:
 *         description: Hotel search completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelSearchResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/search', searchLimiter, validator.validateSearch(), validate, controller.searchHotels);

// Developer-only: dump cached search session (non-production only)
router.get('/debug/search/:searchId', controller.debugSearchSession);

/**
 * @openapi
 * /api/v1/hotels/cities:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Search/autocomplete hotel destination cities
 *     description: >
 *       Returns a list of city suggestions matching the provided query string.
 *       Use this endpoint to implement a city autocomplete dropdown in the UI.
 *       Pass the returned `cityId` in the hotel search request instead of a raw numeric ID.
 *       When `q` is omitted or fewer than 2 characters, the full city list is returned.
 *     security: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: Partial city name to search (min 2 characters for filtering)
 *         schema:
 *           type: string
 *           example: "mum"
 *     responses:
 *       200:
 *         description: City suggestions returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HotelCitySuggestion'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/cities', [query('q').optional().trim()], validate, controller.searchHotelCities);

/**
 * @openapi
 * /api/v1/hotels/{hotelId}:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get hotel details and room options
 *     description: Retrieve hotel details and room availability using a previously generated searchId. Include an admin Bearer JWT in Swagger to see full supplier and markup pricing fields.
 *     security: []
 *     parameters:
 *       - name: hotelId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: searchId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Hotel details and room options retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelDetailsResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:hotelId', validator.validateHotelId(), validate, controller.getHotelDetails);

/**
 * @openapi
 * /api/v1/hotels/recheck:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Recheck room availability and price
 *     description: Revalidate selected rooms and policies before booking. Returns a recheck snapshot for payment and reservation. Include an admin Bearer JWT in Swagger to see full supplier and markup pricing fields.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelRecheckRequest'
 *     responses:
 *       200:
 *         description: Room selection rechecked successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelRecheckResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       410:
 *         $ref: '#/components/responses/Unprocessable'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/recheck', validator.validateRecheck(), validate, controller.recheck);

/**
 * @openapi
 * /api/v1/hotels/bookings:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Create a hotel booking
 *     description: Create a hotel booking from a recheck snapshot. Requires authenticated user and idempotency key.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelBookingCreateRequest'
 *     responses:
 *       201:
 *         description: Hotel booking created and awaiting payment.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelBookingResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bookings', authenticate, idempotency, validator.validateCreateBooking(), validate, controller.createBooking);

/**
 * @openapi
 * /api/v1/hotels/bookings/me:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get current user hotel bookings
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: User hotel bookings retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/HotelBookingSummary'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/bookings/me', authenticate, validator.validateListBookings(), validate, controller.getMyBookings);

/**
 * @openapi
 * /api/v1/hotels/bookings/{id}:
 *   get:
 *     tags:
 *       - Hotels
 *     summary: Get hotel booking by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel booking retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelBookingResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/bookings/:id', authenticate, validator.validateBookingId(), validate, controller.getBooking);

/**
 * @openapi
 * /api/v1/hotels/bookings/{id}/cancel:
 *   post:
 *     tags:
 *       - Hotels
 *     summary: Cancel a hotel booking
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel booking cancellation processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HotelCancelResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/bookings/:id/cancel', authenticate, validator.validateBookingId(), validate, controller.cancelBooking);

module.exports = router;
