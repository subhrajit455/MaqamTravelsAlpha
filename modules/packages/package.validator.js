const { body, param, query } = require('express-validator');

/**
 * ─── PACKAGE VALIDATORS ────────────────────────────────
 * Validators for package endpoints
 */

const validateList = () => [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const validatePackageId = () => [
  param('packageId')
    .isMongoId()
    .withMessage('Invalid package ID'),
];

const validateSearch = () => [
  body('destination')
    .optional()
    .trim()
    .notEmpty(),
  body('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price min must be positive'),
  body('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price max must be positive'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 day'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  validateList,
  validatePackageId,
  validateSearch,
};
