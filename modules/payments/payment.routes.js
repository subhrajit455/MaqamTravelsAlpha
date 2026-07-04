const express = require('express');
const razorpayController = require("./gateways/razorpay/razorpay.controller");
const paypalController = require("./gateways/paypal/paypal.controller");
const phonepeController = require("./gateways/phonepe/phonepe.controller");
const paymentValidator = require('./payment.validator');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

/**
 * ─── PAYMENT ROUTES ────────────────────────────────────
 * Unified multi-gateway payment endpoints
 * All endpoints require authentication
 */

// ─── RAZORPAY ROUTES ───────────────────────────────────
/**
 * Create Razorpay Order
 * POST /api/v1/payments/razorpay/create-order
 * Body: { bookingId, bookingType, amount }
 */
router.post(
  '/razorpay/create-order',
  authenticate,
  paymentValidator.validateCreatePaymentOrder,
  validate,
  razorpayController.createPaymentOrder
);

/**
 * Verify Razorpay Payment
 * POST /api/v1/payments/razorpay/verify
 * Body: { orderId, paymentId, signature }
 */
router.post(
  '/razorpay/verify',
  authenticate,
  paymentValidator.validateVerifyPayment,
  validate,
  razorpayController.verifyPayment
);

/**
 * Get Razorpay Payment Status
 * GET /api/v1/payments/razorpay/:paymentId
 */
router.get(
  '/razorpay/:paymentId',
  authenticate,
  razorpayController.getPaymentStatus
);

/**
 * Refund Razorpay Payment
 * POST /api/v1/payments/razorpay/:paymentId/refund
 * Body: { amount, reason }
 */
router.post(
  '/razorpay/:paymentId/refund',
  authenticate,
  paymentValidator.validateRefundRequest,
  validate,
  razorpayController.refundPayment
);


// ─── PAYPAL ROUTES ─────────────────────────────────────
/**
 * Create PayPal Order
 * POST /api/v1/payments/paypal/create-order
 * Body: { bookingId, bookingType, amount }
 */
router.post(
  '/paypal/create-order',
  authenticate,
  paymentValidator.validateCreatePayPalOrder,
  validate,
  paypalController.createPaymentOrder
);

/**
 * Capture PayPal Order
 * POST /api/v1/payments/paypal/capture
 * Body: { orderId }
 */
router.post(
  '/paypal/capture',
  authenticate,
  paymentValidator.validatePayPalApprove,
  validate,
  paypalController.capturePayment
);

/**
 * Get PayPal Payment Status
 * GET /api/v1/payments/paypal/:paymentId
 */
router.get(
  '/paypal/:paymentId',
  authenticate,
  paypalController.getPaymentStatus
);

/**
 * Refund PayPal Payment
 * POST /api/v1/payments/paypal/:paymentId/refund
 * Body: { amount, reason }
 */
router.post(
  '/paypal/:paymentId/refund',
  authenticate,
  paymentValidator.validateRefundRequest,
  validate,
  paypalController.refundPayment
);


// ─── PHONEPE ROUTES ────────────────────────────────────
/**
 * Create PhonePe Payment Request
 * POST /api/v1/payments/phonepe/create-order
 * Body: { bookingId, bookingType, amount, phoneNumber }
 */
router.post(
  '/phonepe/create-order',
  authenticate,
  paymentValidator.validateCreatePhonePeOrder,
  validate,
  phonepeController.createPaymentOrder
);

/**
 * Verify PhonePe Payment
 * POST /api/v1/payments/phonepe/verify
 * Body: { transactionId, paymentId }
 */
router.post(
  '/phonepe/verify',
  authenticate,
  paymentValidator.validatePhonePeCallback,
  validate,
  phonepeController.verifyPayment
);

/**
 * Get PhonePe Payment Status
 * GET /api/v1/payments/phonepe/:paymentId
 */
router.get(
  '/phonepe/:paymentId',
  authenticate,
  phonepeController.getPaymentStatus
);

/**
 * Refund PhonePe Payment
 * POST /api/v1/payments/phonepe/:paymentId/refund
 * Body: { amount, reason }
 */
router.post(
  '/phonepe/:paymentId/refund',
  authenticate,
  paymentValidator.validateRefundRequest,
  validate,
  phonepeController.refundPayment
);

module.exports = router;
