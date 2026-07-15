const { body, param } = require('express-validator');
const { TOUR_STATUS } = require('../../config/constants');

/**
 * ─── TOUR VALIDATORS ──────────────────────────────────
 * Validators for tour endpoints
 */

const validateTourId = () => [
  param('tourId')
    .isMongoId()
    .withMessage('Invalid tour ID'),
];

const validateCreateTour = () => [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Tour title is required'),
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be valid'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be valid'),
  body('budget')
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
];

const validateUpdateTour = () => [
  param('tourId')
    .isMongoId()
    .withMessage('Invalid tour ID'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid'),
];

module.exports = {
  validateTourId,
  validateCreateTour,
  validateUpdateTour,
};
