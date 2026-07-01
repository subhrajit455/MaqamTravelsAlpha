const { body, param } = require('express-validator');

/**
 * ─── PAYMENT VALIDATORS ────────────────────────────────
 * Validators for payment endpoints
 */

const validatePaymentId = () => [
  param('paymentId')
    .isMongoId()
    .withMessage('Invalid payment ID'),
];

const validateCreatePayment = () => [
  body('bookingId')
    .isMongoId()
    .withMessage('Invalid booking ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('paymentMethod')
    .isIn(['stripe', 'razorpay', 'paypal', 'bank_transfer'])
    .withMessage('Invalid payment method'),
];

const validateVerifyPayment = () => [
  body('paymentId')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('transactionId')
    .trim()
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('status')
    .isIn(['success', 'failed', 'pending'])
    .withMessage('Invalid status'),
];

module.exports = {
  validatePaymentId,
  validateCreatePayment,
  validateVerifyPayment,
};
