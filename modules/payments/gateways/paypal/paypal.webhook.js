const express = require('express');
const crypto = require('crypto');
const paypalService = require('./paypal.service');
const Payment = require('../../payment.model');
const logger = require('../../../../utils/logger');

const router = express.Router();

/**
 * ─── PAYPAL WEBHOOK HANDLER ──────────────────────────
 * PayPal IPN (Instant Payment Notification) endpoint
 * 
 * This is a public endpoint for PayPal to send notifications
 * Security: We verify the event with PayPal API
 */

/**
 * Verify PayPal IPN
 * @param {object} body - IPN message body
 * @returns {Promise<boolean>}
 */
const verifyIPNSignature = async (body) => {
    try {
        logger.info('[PayPal Webhook] Verifying IPN signature');

        // TODO: Implement PayPal IPN verification
        // 1. POST back to PayPal with 'cmd=_notify-validate'
        // 2. Parse PayPal response
        // 3. Return true if VERIFIED, false otherwise

        throw new Error('PayPal IPN verification not yet implemented');
    } catch (error) {
        logger.error(`[PayPal Webhook] IPN verification error: ${error.message}`);
        return false;
    }
};

/**
 * Handle payment completed
 */
const handlePaymentCompleted = async (ipnData) => {
    try {
        logger.info(`[PayPal Webhook] Payment completed: ${ipnData.txn_id}`);

        const { txn_id: transactionId, custom: paymentId, mc_gross: amount, payment_status } = ipnData;

        if (payment_status !== 'Completed') {
            logger.warn(`[PayPal Webhook] Payment not completed, status: ${payment_status}`);
            return;
        }

        // Find payment by internal ID stored in 'custom' field
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            logger.warn(`[PayPal Webhook] Payment record not found: ${paymentId}`);
            return;
        }

        // Update payment with PayPal transaction info
        payment.paypalTransactionId = transactionId;
        payment.status = 'paid';
        payment.verifiedAt = new Date();
        await payment.save();

        // Process successful payment
        await paypalService.processSuccessfulPayment(paymentId);

        logger.info(`[PayPal Webhook] Payment processed - Transaction: ${transactionId}`);
    } catch (error) {
        logger.error(`[PayPal Webhook] Handle payment completed error: ${error.message}`);
    }
};

/**
 * Handle payment refunded
 */
const handlePaymentRefunded = async (ipnData) => {
    try {
        logger.info(`[PayPal Webhook] Refund processed: ${ipnData.txn_id}`);

        const { txn_id: refundId, parent_txn_id: originalTxn, mc_gross: amount } = ipnData;

        // Find payment by original transaction
        const payment = await Payment.findOne({ paypalTransactionId: originalTxn });

        if (!payment) {
            logger.warn(`[PayPal Webhook] Original payment not found: ${originalTxn}`);
            return;
        }

        // Update with refund info
        payment.status = 'refunded';
        payment.refundRefId = refundId;
        payment.refundAmount = Math.abs(parseFloat(amount));
        payment.refundProcessedAt = new Date();
        await payment.save();

        logger.info(`[PayPal Webhook] Refund recorded - Refund ID: ${refundId}`);
    } catch (error) {
        logger.error(`[PayPal Webhook] Handle refund error: ${error.message}`);
    }
};

/**
 * Main IPN endpoint
 * POST /webhook/paypal/ipn
 */
router.post('/ipn', async (req, res) => {
    try {
        logger.info('[PayPal Webhook] IPN received');

        // Verify signature
        const isValid = await verifyIPNSignature(req.body);

        if (!isValid) {
            logger.warn('[PayPal Webhook] Invalid IPN signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }

        const ipnData = req.body;

        // Route based on transaction type
        switch (ipnData.txn_type) {
            case 'web_accept':
            case 'express_checkout':
                await handlePaymentCompleted(ipnData);
                break;

            case 'send_money':
            case 'web_accept_refund':
            case 'refund':
                await handlePaymentRefunded(ipnData);
                break;

            case 'recurring_payment':
                logger.info('[PayPal Webhook] Recurring payment received');
                break;

            default:
                logger.info(`[PayPal Webhook] Unhandled transaction type: ${ipnData.txn_type}`);
        }

        // Always return 200 to acknowledge
        res.json({ success: true });
    } catch (error) {
        logger.error(`[PayPal Webhook] IPN error: ${error.message}`);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
