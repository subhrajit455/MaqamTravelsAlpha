/**
 * ─── PAYPAL CLIENT ──────────────────────────────────
 * Facade/Interface for PayPal Gateway
 */

const paypalAdapter = require('./paypal.adapter');
const logger = require('../../../../utils/logger');

const client = {
    orders: {
        create: async (amount, bookingId, customerDetails) => {
            logger.info(`[PayPal] Creating order: ${bookingId}`);
            return paypalAdapter.createOrder(amount, bookingId, customerDetails);
        },

        details: async (orderId) => {
            logger.info(`[PayPal] Fetching order: ${orderId}`);
            return paypalAdapter.getPaymentDetails(orderId);
        },

        capture: async (orderId, details) => {
            logger.info(`[PayPal] Capturing order: ${orderId}`);
            return paypalAdapter.capturePayment(orderId, details);
        },
    },

    payments: {
        refund: async (captureId, amount, reason) => {
            logger.info(`[PayPal] Refunding capture: ${captureId}`);
            return paypalAdapter.refundPayment(captureId, amount, reason);
        },
    },
};

module.exports = client;
