const express = require('express');
const crypto = require('crypto');
const phonePeService = require('./phonepe.service');
const Payment = require('../../payment.model');
const logger = require('../../../../utils/logger');

const router = express.Router();

/**
 * ─── PHONEPE WEBHOOK HANDLER ──────────────────────────
 * S2S (Server-to-Server) callback from PhonePe
 * 
 * This is a public endpoint for PhonePe to send notifications
 * Security: Verify checksum using salt
 */

/**
 * Verify PhonePe callback checksum
 * @param {object} body - Callback body
 * @param {string} checksum - Checksum header
 * @returns {boolean}
 */
const verifyChecksum = (body, checksum) => {
    try {
        logger.info('[PhonePe Webhook] Verifying checksum');

        // TODO: Implement checksum verification
        // PhonePe uses SHA256 for checksum
        // const message = JSON.stringify(body);
        // const expectedChecksum = crypto
        //   .createHmac('sha256', process.env.PHONEPE_SALT_KEY)
        //   .update(message)
        //   .digest('hex');
        // return expectedChecksum === checksum;

        return false;
    } catch (error) {
        logger.error(`[PhonePe Webhook] Checksum verification error: ${error.message}`);
        return false;
    }
};

/**
 * Handle success callback
 */
const handleSuccessCallback = async (callbackData) => {
    try {
        logger.info(`[PhonePe Webhook] Success callback: ${callbackData.transactionId}`);

        const { transactionId, bookingId } = callbackData;

        // Find payment by booking ID
        const payment = await Payment.findOne({ bookingId });

        if (!payment) {
            logger.warn(`[PhonePe Webhook] Payment not found for booking: ${bookingId}`);
            return;
        }

        // Verify with PhonePe
        await phonePeService.verifyPaymentCallback(transactionId, payment._id);

        // Process successful payment
        await phonePeService.processSuccessfulPayment(payment._id);

        logger.info(`[PhonePe Webhook] Payment processed - Booking: ${bookingId}`);
    } catch (error) {
        logger.error(`[PhonePe Webhook] Handle success callback error: ${error.message}`);
    }
};

/**
 * Handle failure callback
 */
const handleFailureCallback = async (callbackData) => {
    try {
        logger.info(`[PhonePe Webhook] Failure callback: ${callbackData.transactionId}`);

        const { transactionId, bookingId, failureReason } = callbackData;

        // Find and update payment
        const payment = await Payment.findOne({ bookingId });

        if (payment) {
            payment.status = 'failed';
            payment.failureReason = failureReason;
            await payment.save();
        }

        logger.warn(`[PhonePe Webhook] Payment failed - Booking: ${bookingId}, Reason: ${failureReason}`);
    } catch (error) {
        logger.error(`[PhonePe Webhook] Handle failure callback error: ${error.message}`);
    }
};

/**
 * Main callback endpoint
 * POST /webhook/phonepe/callback
 */
router.post('/callback', async (req, res) => {
    try {
        logger.info('[PhonePe Webhook] Callback received');

        // Verify checksum
        const checksum = req.headers['x-verify'] || req.headers['x-phonepe-checksum'];
        if (!verifyChecksum(req.body, checksum)) {
            logger.warn('[PhonePe Webhook] Invalid checksum');
            return res.status(403).json({ success: false, error: 'Invalid checksum' });
        }

        const { transactionId, status, code, data } = req.body;

        // Route based on status
        if (status === 'SUCCESS' && code === 'PAYMENT_SUCCESS') {
            await handleSuccessCallback(data);
        } else if (status === 'FAILURE' || code === 'PAYMENT_FAILED') {
            await handleFailureCallback(data);
        } else {
            logger.info(`[PhonePe Webhook] Unhandled status: ${status}, code: ${code}`);
        }

        // Always return success
        res.json({ success: true, status });
    } catch (error) {
        logger.error(`[PhonePe Webhook] Callback error: ${error.message}`);
        res.json({ success: false, error: error.message });
    }
});

module.exports = router;
