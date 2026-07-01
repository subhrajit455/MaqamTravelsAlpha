const router = require('express').Router();
const paymentController = require('./payment.controller');
const paymentValidator = require('./payment.validator');
const validate = require('../../middleware/validate');

/**
 * ─── PAYMENT ROUTES ────────────────────────────────────
 * Pattern: Create payment, verify payment, refund
 * Requires auth middleware
 */

// TODO: Add auth middleware

// Get payment details
router.get('/:paymentId', paymentValidator.validatePaymentId(), validate, paymentController.getPaymentDetails);

// Get user's payments
router.get('/', paymentController.getMyPayments);

// Create payment (initiate)
router.post('/', paymentValidator.validateCreatePayment(), validate, paymentController.createPayment);

// Verify payment (callback from Stripe/Razorpay)
router.post('/verify', paymentValidator.validateVerifyPayment(), validate, paymentController.verifyPayment);

// Request refund
router.post('/:paymentId/refund', paymentValidator.validatePaymentId(), validate, paymentController.requestRefund);

module.exports = router;
