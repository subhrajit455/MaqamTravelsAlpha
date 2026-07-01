const router = require('express').Router();
const bookingController = require('./booking.controller');
const bookingValidator = require('./booking.validator');
const validate = require('../../middleware/validate');

/**
 * ─── BOOKING ROUTES ───────────────────────────────────
 * Pattern: Create/read/update bookings (hotels + flights)
 * Requires auth middleware
 */

// TODO: Add auth middleware to all routes

// Get all user's bookings
router.get('/', bookingController.getMyBookings);

// Get booking details
router.get('/:bookingId', bookingValidator.validateBookingId(), validate, bookingController.getBookingDetails);

// Create booking (after payment)
router.post('/', bookingValidator.validateCreateBooking(), validate, bookingController.createBooking);

// Update booking
router.put('/:bookingId', bookingValidator.validateUpdateBooking(), validate, bookingController.updateBooking);

// Cancel booking
router.post('/:bookingId/cancel', bookingValidator.validateBookingId(), validate, bookingController.cancelBooking);

module.exports = router;
