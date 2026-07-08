const router = require("express").Router();
const bookingController = require("./booking.controller");
const bookingValidator = require("./booking.validator");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/auth");

/**
 * ─── BOOKING ROUTES ───────────────────────────────────
 * Pattern: Create/read/update bookings (hotels + flights)
 * Requires auth middleware
 */

// TODO: Add auth middleware to all routes

// Get all user's bookings
router.get("/", authenticate, bookingController.getMyBookings);

// Get booking details
router.get(
  "/:bookingId",
  authenticate,
  bookingValidator.validateBookingId(),
  validate,
  bookingController.getBookingDetails,
);

// Create booking (after payment)
router.post(
  "/",
  authenticate,
  bookingValidator.validateCreateBooking(),
  validate,
  bookingController.createBooking,
);

// Update booking
router.put(
  "/:bookingId",
  authenticate,
  bookingValidator.validateUpdateBooking(),
  validate,
  bookingController.updateBooking,
);

// Cancel booking
router.post(
  "/:bookingId/cancel",
  authenticate,
  bookingValidator.validateBookingId(),
  validate,
  bookingController.cancelBooking,
);

module.exports = router;
