const { body, param } = require('express-validator');

/**
 * ─── FLIGHT VALIDATORS ────────────────────────────────
 * Validators for flight search and details
 */

const validateSearch = () => [
  body('origin')
    .trim()
    .notEmpty()
    .withMessage('Departure airport code is required'),
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Arrival airport code is required'),
  body('departureDate')
    .isISO8601()
    .withMessage('Departure date must be a valid date'),
  body('returnDate')
    .optional()
    .isISO8601()
    .withMessage('Return date must be a valid date'),
  
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

const validateResultIndex= () => [
  body('resultIndex')
    .trim()
    .notEmpty()
    .withMessage('Result index is required'),
];

module.exports = {
  validateSearch,
  validateResultIndex,
};
