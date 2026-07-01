const router = require('express').Router();
const hotelController = require('./hotel.controller');
const hotelValidator = require('./hotel.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');

/**
 * ─── HOTEL ROUTES ──────────────────────────────────────
 * Pattern: Search SRDV hotels, get details, create bookings
 * Search is rate-limited since SRDV calls are expensive
 */

// Public search route
router.get('/search', searchLimiter, hotelValidator.validateSearch(), validate, hotelController.searchHotels);

// Get hotel details by SRDV ID
router.get('/:hotelId', hotelValidator.validateHotelId(), validate, hotelController.getHotelDetails);

// Get user's hotel bookings — requires auth
// router.get('/my-bookings', authMiddleware, hotelController.getMyBookings);

// TODO: Create booking, update booking, cancel booking — implement with booking service

module.exports = router;
