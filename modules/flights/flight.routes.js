const router = require('express').Router();
const  {
  searchFlights,
  getFareQuote,
  book
} = require('./flight.controller');
const flightValidator = require('./flight.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');


// Public search route
router.post('/search', searchLimiter, flightValidator.validateSearch(), validate, searchFlights);

// Get flight details by SRDV ID and traceId
router.post('/farequote', flightValidator.validateFlightId(), validate,  getFareQuote);
router.post('/book', flightValidator.validateFlightId(), validate,  book);

// TODO: Create booking, get my bookings — implement with booking service

module.exports = router;
