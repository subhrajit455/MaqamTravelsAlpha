const express = require('express');
const axios = require('axios');
const paypalService = require('./paypal.service');
const Payment = require('../../payment.model');
const logger = require('../../../../utils/logger');

const router = express.Router();

/**
 * ─── PAYPAL WEBHOOK HANDLER ──────────────────────────
 * PayPal IPN (Instant Payment Notification) endpoint
 * 
 * This is a public endpoint for PayPal to send notifications
 * Security: We verify the event with PayPal API by posting back to check validity
 */

/**
 * Verify PayPal IPN message signature
 * @param {object} body - IPN message body
 * @returns {Promise<boolean>} True if valid and verified by PayPal
 */
const verifyIPNSignature = async (body) => {
    try {
        logger.info('[PayPal Webhook] Verifying IPN signature with PayPal API');

        // Construct URL-encoded parameters representing the original IPN message prepended with command
        const params = new URLSearchParams();
        params.append('cmd', '_notify-validate');
        for (const key in body) {
            params.append(key, body[key]);
        }

        const paypalURL = process.env.PAYPAL_MODE === 'production'
            ? 'https://ipnpb.paypal.com/cgi-bin/webscr'
            : 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';

        const response = await axios.post(paypalURL, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'MaqamTravels-IPN-Verifier/1.0.0',
            },
            timeout: 10000,
        });

        const isVerified = response.data === 'VERIFIED';
        logger.info(`[PayPal Webhook] Verification response: "${response.data}" (Verified: ${isVerified})`);
        return isVerified;
    } catch (error) {
        logger.error(`[PayPal Webhook] IPN verification request error: ${error.message}`);
        return false;
    }
};

/**
 * Handle payment completed IPN
 */
const handlePaymentCompleted = async (ipnData) => {
    try {
        logger.info(`[PayPal Webhook] Payment completed: ${ipnData.txn_id}`);

        const { txn_id: transactionId, custom: paymentId, mc_gross: amount, payment_status } = ipnData;

        if (payment_status !== 'Completed') {
            logger.warn(`[PayPal Webhook] Payment status is not Completed: ${payment_status}`);
            return;
        }

        // Find payment by internal ID stored in 'custom' field
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            logger.warn(`[PayPal Webhook] Payment record not found: ${paymentId}`);
            return;
        }

        // Update payment with PayPal transaction info if not already paid
        if (payment.status !== 'paid') {
            payment.paypalTransactionId = transactionId;
            payment.paypalCaptureId = transactionId; // For IPN, transactionId acts as captureId
            payment.status = 'paid';
            payment.verifiedAt = new Date();
            await payment.save();

            // Process successful payment
            await paypalService.processSuccessfulPayment(paymentId);
            logger.info(`[PayPal Webhook] Payment processed - Transaction: ${transactionId}`);
        } else {
            logger.info(`[PayPal Webhook] Payment already marked as paid - Transaction: ${transactionId}`);
        }
    } catch (error) {
        logger.error(`[PayPal Webhook] Handle payment completed error: ${error.message}`);
    }
};

/**
 * Handle payment refunded IPN
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
        if (payment.status !== 'refunded') {
            payment.status = 'refunded';
            payment.refundRefId = refundId;
            payment.refundAmount = Math.abs(parseFloat(amount));
            payment.refundProcessedAt = new Date();
            await payment.save();

            logger.info(`[PayPal Webhook] Refund recorded - Refund ID: ${refundId}`);
        }
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
        logger.info('[PayPal Webhook] IPN request received');

        // Verify signature
        const isValid = await verifyIPNSignature(req.body);

        if (!isValid) {
            logger.warn('[PayPal Webhook] Invalid IPN signature verification check');
            return res.status(400).json({ error: 'Invalid IPN signature' });
        }

        const ipnData = req.body;

        // Route based on transaction type or payment status
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

            default:
                // Check payment status directly if txn_type is missing or different
                if (ipnData.payment_status === 'Completed') {
                    await handlePaymentCompleted(ipnData);
                } else if (ipnData.payment_status === 'Refunded' || ipnData.payment_status === 'Reversed') {
                    await handlePaymentRefunded(ipnData);
                } else {
                    logger.info(`[PayPal Webhook] Unhandled IPN transaction. type: ${ipnData.txn_type}, status: ${ipnData.payment_status}`);
                }
        }

        // Always return 200 to acknowledge IPN reception to PayPal
        res.status(200).send('IPN OK');
    } catch (error) {
        logger.error(`[PayPal Webhook] IPN processing error: ${error.message}`);
        // Return 200 even on processing errors to prevent PayPal from resending repeatedly
        res.status(200).send('IPN Error Handled');
    }
});

module.exports = router;
