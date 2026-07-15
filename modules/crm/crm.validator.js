const { body, param, query } = require('express-validator');
const { LEAD_STATUS } = require('../../config/constants');

/**
 * ─── CRM VALIDATORS ───────────────────────────────────
 * Validators for CRM endpoints
 */

const validateListLeads = () => [
  query('status')
    .optional()
    .isIn(Object.values(LEAD_STATUS))
    .withMessage('Invalid lead status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be at least 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const validateLeadId = () => [
  param('leadId')
    .isMongoId()
    .withMessage('Invalid lead ID'),
];

const validateCreateLead = () => [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('email')
    .isEmail()
    .withMessage('Invalid email format'),
  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  body('travelDates')
    .isObject()
    .withMessage('Travel dates must be an object'),
  body('numberOfPeople')
    .isInt({ min: 1 })
    .withMessage('Number of people must be at least 1'),
];

const validateUpdateLead = () => [
  param('leadId')
    .isMongoId()
    .withMessage('Invalid lead ID'),
  body('status')
    .optional()
    .isIn(Object.values(LEAD_STATUS))
    .withMessage('Invalid lead status'),
];

module.exports = {
  validateListLeads,
  validateLeadId,
  validateCreateLead,
  validateUpdateLead,
};
