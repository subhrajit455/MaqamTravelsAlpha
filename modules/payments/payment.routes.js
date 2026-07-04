const express = require('express');
const razorpayController = require("./gateways/razorpay/razorpay.controller")
const paymentValidator = require('./gateways/razorpay/payment.validator');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

/**
 * ─── PAYMENT ROUTES ────────────────────────────────────
 * Razorpay payment endpoints
 * All endpoints require authentication
 */




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
 * Verify Payment
 * POST /api/v1/payments/razorpay/verify
 * Body: { orderId, paymentId, signature }
 * Called from frontend after Razorpay checkout
 */
router.post(
  '/razorpay/verify',
  authenticate,
  paymentValidator.validateVerifyPayment,
  validate,
  razorpayController.verifyPayment
);

/**
 * Get Payment Status
 * GET /api/v1/payments/razorpay/:paymentId
 */
router.get(
  '/razorpay/:paymentId',
  authenticate,
  razorpayController.getPaymentStatus
);

/**
 * Refund Payment
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

module.exports = router;
