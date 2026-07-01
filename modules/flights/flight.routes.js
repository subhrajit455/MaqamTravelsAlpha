const router = require('express').Router();
const flightController = require('./flight.controller');
const flightValidator = require('./flight.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');

/**
 * ─── FLIGHT ROUTES ────────────────────────────────────
 * Pattern: Search SRDV flights, get details, create bookings
 * Search is rate-limited since SRDV calls are expensive
 */

// Public search route
router.get('/search', searchLimiter, flightValidator.validateSearch(), validate, flightController.searchFlights);

// Get flight details by SRDV ID
router.get('/:flightId', flightValidator.validateFlightId(), validate, flightController.getFlightDetails);

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
