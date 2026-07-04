const { body, param, validationResult } = require('express-validator');

/**
 * ─── PAYMENT VALIDATORS ────────────────────────────────
 * Gateway-agnostic validators for payment endpoints
 */

// ─── Generic Payment Validators ────────────────────────
const validatePaymentId = () => [
  param('paymentId')
    .isMongoId()
    .withMessage('Invalid payment ID'),
];

const validateCreatePayment = () => [
  body('bookingId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('amount')
    .notEmpty()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('paymentMethod')
    .notEmpty()
    .isIn(['razorpay', 'paypal', 'phonepe', 'bank_transfer'])
    .withMessage('Invalid payment method'),
];

// ─── Razorpay Validators ──────────────────────────────
const validateCreatePaymentOrder = [
  body('bookingId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('bookingType')
    .notEmpty()
    .isIn(['flight', 'hotel', 'tour', 'package'])
    .withMessage('Invalid booking type'),
  body('amount')
    .notEmpty()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
];

const validateVerifyPayment = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('signature')
    .notEmpty()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid signature format'),
];

const validateRefundRequest = [
  param('paymentId')
    .isMongoId()
    .withMessage('Invalid payment ID'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
];

// ─── PayPal Validators ────────────────────────────────
const validateCreatePayPalOrder = [
  body('bookingId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('bookingType')
    .notEmpty()
    .isIn(['flight', 'hotel', 'tour', 'package'])
    .withMessage('Invalid booking type'),
  body('amount')
    .notEmpty()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
];

const validatePayPalApprove = [
  body('orderId')
    .notEmpty()
    .withMessage('PayPal Order ID is required'),
  body('payerId')
    .notEmpty()
    .withMessage('PayPal Payer ID is required'),
];

// ─── PhonePe Validators ───────────────────────────────
const validateCreatePhonePeOrder = [
  body('bookingId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid booking ID is required'),
  body('bookingType')
    .notEmpty()
    .isIn(['flight', 'hotel', 'tour', 'package'])
    .withMessage('Invalid booking type'),
  body('amount')
    .notEmpty()
    .isFloat({ min: 1 })
    .withMessage('Amount must be greater than 0'),
  body('phoneNumber')
    .notEmpty()
    .isLength({ min: 10, max: 10 })
    .withMessage('Valid 10-digit phone number required'),
];

const validatePhonePeCallback = [
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  body('status')
    .notEmpty()
    .isIn(['SUCCESS', 'FAILED', 'PENDING'])
    .withMessage('Invalid status'),
];

module.exports = {
  // Generic
  validatePaymentId,
  validateCreatePayment,

  // Razorpay
  validateCreatePaymentOrder,
  validateVerifyPayment,
  validateRefundRequest,

  // PayPal
  validateCreatePayPalOrder,
  validatePayPalApprove,

  // PhonePe
  validateCreatePhonePeOrder,
  validatePhonePeCallback,
};
