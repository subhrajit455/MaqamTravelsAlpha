const paypalService = require('./paypal.service');
const Payment = require('../../payment.model');
const { sendSuccess, sendCreated, sendBadRequest, sendNotFound } = require('../../../../utils/apiResponse');
const { validationResult } = require('express-validator');
const logger = require('../../../../utils/logger');

/**
 * ─── PAYPAL PAYMENT CONTROLLER ───────────────────────
 * Endpoints for PayPal payment operations
 */

/**
 * POST /api/v1/payments/paypal/create-order
 * Create a PayPal order for a booking
 */
const createPaymentOrder = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendBadRequest(res, 'Validation failed', errors.array());
        }

        const userId = req.user?.id;
        const { bookingId, bookingType } = req.body;

        logger.info(`[PayPal Controller] Creating payment order for user: ${userId}, booking: ${bookingId}`);

        const orderData = await paypalService.createPaymentOrder(userId, bookingId, bookingType);

        return sendCreated(res, {
            message: 'PayPal order created successfully',
            data: orderData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/payments/paypal/capture
 * Capture an approved PayPal order
 * Called from frontend after user approves payment on PayPal
 */
const capturePayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendBadRequest(res, 'Validation failed', errors.array());
        }

        const { orderId } = req.body;

        logger.info(`[PayPal Controller] Capturing PayPal order: ${orderId}`);

        const captureData = await paypalService.captureAndVerifyPayment(orderId);

        // Process successful payment
        const result = await paypalService.processSuccessfulPayment(captureData.paymentId);

        return sendSuccess(res, {
            message: 'PayPal payment captured and processed successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/payments/paypal/:paymentId
 * Get payment status
 */
const getPaymentStatus = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user?.id;

        logger.info(`[PayPal Controller] Fetching payment status for payment: ${paymentId}`);

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return sendNotFound(res, 'Payment not found');
        }

        // Verify ownership
        if (payment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        return sendSuccess(res, {
            message: 'Payment status retrieved',
            data: {
                paymentId: payment._id,
                paypalOrderId: payment.paypalOrderId,
                paypalCaptureId: payment.paypalCaptureId,
                amount: payment.amount,
                status: payment.status,
                verifiedAt: payment.verifiedAt,
                createdAt: payment.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/payments/paypal/:paymentId/refund
 * Refund a PayPal payment
 */
 
const refundPayment = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendBadRequest(res, 'Validation failed', errors.array());
        }

        const { paymentId } = req.params;
        const { amount, reason } = req.body;
        const userId = req.user?.id;

        logger.info(`[PayPal Controller] Processing refund for payment: ${paymentId}`);

        // Verify ownership first
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            return sendNotFound(res, 'Payment not found');
        }

        if (payment.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const refundData = await paypalService.refundPayment(
            paymentId,
            amount,
            reason
        );

        return sendSuccess(res, {
            message: 'PayPal refund processed successfully',
            data: refundData,
        });
    } catch (error) {
        next(error);
    }
};
//  Now I have Cloud Opus 4.6 So I want to You write one of the best prompt for all issue 
//   like Validation problems , Currency Issue , Capture endpoint , Check Duplicate pyment 
// , booking reference (use mongooes dynmic refercne),  Webhook need improvement , Idempatency ,  transation , Payment expiry , retry logic ,Previent Idempotency key (Double click != two pyment), Distributed Lock , Queue , And Audit log , Cover every usecase possible for payment gateway integration with paypal and write batter prompt...  

module.exports = {
    createPaymentOrder,
    capturePayment,
    getPaymentStatus,
    refundPayment,
};
