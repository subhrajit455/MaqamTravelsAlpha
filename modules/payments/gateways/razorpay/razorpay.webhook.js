const express = require('express');
const crypto = require('crypto');
const razorpayService = require('./razorpay.service');
const Payment = require('../../payment.model');
const logger = require('../../../../utils/logger');
const { sendSuccess, sendError } = require('../../../../utils/apiResponse');

const router = express.Router();

/**
 * ─── RAZORPAY WEBHOOK HANDLER ──────────────────────────
 * POST /webhook/razorpay/events
 * 
 * Razorpay sends webhook after:
 * - Payment successful
 * - Payment failed
 * - Refund processed
 * 
 * This is a public endpoint (NO auth required)
 * Security: We verify the signature using RAZORPAY_KEY_SECRET
 */

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (req) => {
    try {
        const body = JSON.stringify(req.body);
        const signature = req.headers['x-razorpay-signature'];

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        logger.error(`[Razorpay Webhook] Signature verification error: ${error.message}`);
        return false;
    }
};

/**
 * Handle payment.authorized event
 * Payment has been authorized but not captured yet
 */
const handlePaymentAuthorized = async (event) => {
    try {
        logger.info(`[Razorpay Webhook] Payment authorized: ${event.payload.payment.entity.id}`);

        // Auto-capture the payment
        const { order_id, id: paymentId } = event.payload.payment.entity;
        // Razorpay usually auto-captures for most payment methods
        // This is here for manual capture scenarios
    } catch (error) {
        logger.error(`[Razorpay Webhook] Handle payment authorized error: ${error.message}`);
        throw error;
    }
};

/**
 * Handle payment.captured event (MAIN EVENT)
 * Payment successful and money is captured
 */
const handlePaymentCaptured = async (event) => {
    try {
        logger.info(`[Razorpay Webhook] Payment captured: ${event.payload.payment.entity.id}`);

        const payment = event.payload.payment.entity;
        const { order_id, id: paymentId, amount, status } = payment;

        if (status !== 'captured') {
            logger.warn(`[Razorpay Webhook] Payment not in captured status: ${status}`);
            return;
        }

        // Verify and process payment
        const result = await razorpayService.verifyAndProcessPayment(
            order_id,
            paymentId,
            payment.notes?.signature || '' // Signature from payment metadata if available
        );

        // Process successful payment (update booking, ticket, send notifications)
        await razorpayService.processSuccessfulPayment(result.paymentId);

        logger.info(`[Razorpay Webhook] Payment processed successfully - Booking: ${result.bookingId}`);
    } catch (error) {
        logger.error(`[Razorpay Webhook] Handle payment captured error: ${error.message}`);
        // Don't throw - webhook must return 200 even on error
        // Log for manual investigation
    }
};

/**
 * Handle payment.failed event
 * Payment failed
 */
const handlePaymentFailed = async (event) => {
    try {
        logger.info(`[Razorpay Webhook] Payment failed: ${event.payload.payment.entity.id}`);

        const payment = event.payload.payment.entity;
        const { order_id, id: paymentId, error_description } = payment;

        // Update payment status to failed
        await Payment.findOneAndUpdate(
            { razorpayOrderId: order_id },
            {
                razorpayPaymentId: paymentId,
                status: 'failed',
                failureReason: error_description,
            }
        );

        logger.warn(`[Razorpay Webhook] Payment failed recorded - Order: ${order_id}, Reason: ${error_description}`);
    } catch (error) {
        logger.error(`[Razorpay Webhook] Handle payment failed error: ${error.message}`);
    }
};

/**
 * Handle refund.created event
 * Refund initiated
 */
const handleRefundCreated = async (event) => {
    try {
        logger.info(`[Razorpay Webhook] Refund initiated: ${event.payload.refund.entity.id}`);

        const refund = event.payload.refund.entity;
        const { id: refundId, payment_id: paymentId, amount } = refund;

        // Update payment with refund info
        await Payment.findOneAndUpdate(
            { razorpayPaymentId: paymentId },
            {
                refundRefId: refundId,
                refundAmount: amount / 100,
                status: 'refunded',
            }
        );

        logger.info(`[Razorpay Webhook] Refund recorded - Refund ID: ${refundId}`);
    } catch (error) {
        logger.error(`[Razorpay Webhook] Handle refund created error: ${error.message}`);
    }
};

/**
 * Main webhook endpoint
 * POST /webhook/razorpay/events
 */
router.post('/events', async (req, res) => {
    try {
        // Verify webhook signature
        if (!verifyWebhookSignature(req)) {
            logger.warn('[Razorpay Webhook] Invalid webhook signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const event = req.body;
        logger.info(`[Razorpay Webhook] Event received: ${event.event}`);

        // Route to appropriate handler based on event type
        switch (event.event) {
            case 'payment.authorized':
                await handlePaymentAuthorized(event);
                break;

            case 'payment.captured':
                await handlePaymentCaptured(event);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event);
                break;

            case 'refund.created':
                await handleRefundCreated(event);
                break;

            case 'invoice.paid':
                logger.info(`[Razorpay Webhook] Invoice paid: ${event.payload.invoice.entity.id}`);
                break;

            default:
                logger.info(`[Razorpay Webhook] Unhandled event: ${event.event}`);
        }

        // Always return 200 to acknowledge receipt
        // Razorpay will retry if you don't return 200
        res.json({ success: true, event: event.event });
    } catch (error) {
        logger.error(`[Razorpay Webhook] Webhook error: ${error.message}`);
        // Still return 200 to prevent Razorpay retry
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
