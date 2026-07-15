const { body, param, query } = require('express-validator');

/**
 * ─── HOTEL VALIDATORS ──────────────────────────────────
 * Validators for hotel search and details
 */

const validateSearch = () => [
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  body('checkIn')
    .isISO8601()
    .withMessage('Check-in must be a valid date'),
  body('checkOut')
    .isISO8601()
    .withMessage('Check-out must be a valid date'),
  body('guests')
    .isInt({ min: 1 })
    .withMessage('Guests must be at least 1'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const validateHotelId = () => [
  param('hotelId')
    .trim()
    .notEmpty()
    .withMessage('Hotel ID is required'),
];

module.exports = {
  validateSearch,
  validateHotelId,
};
