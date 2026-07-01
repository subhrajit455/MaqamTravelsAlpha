const { body, param } = require('express-validator');

/**
 * ─── FLIGHT VALIDATORS ────────────────────────────────
 * Validators for flight search and details
 */

const validateSearch = () => [
  body('departure')
    .trim()
    .notEmpty()
    .withMessage('Departure airport code is required'),
  body('arrival')
    .trim()
    .notEmpty()
    .withMessage('Arrival airport code is required'),
  body('departDate')
    .isISO8601()
    .withMessage('Departure date must be a valid date'),
  body('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Return date must be a valid date'),
  body('passengers')
    .isInt({ min: 1 })
    .withMessage('Passengers must be at least 1'),
  body('tripType')
    .optional()
    .isIn(['oneway', 'roundtrip'])
    .withMessage('Trip type must be oneway or roundtrip'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const validateFlightId = () => [
  param('flightId')
    .trim()
    .notEmpty()
    .withMessage('Flight ID is required'),
];

module.exports = {
  validateSearch,
  validateFlightId,
};
