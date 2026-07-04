/**
 * ─── PAYPAL ADAPTER ──────────────────────────────────
 * Handles all PayPal API calls
 * 
 * Similar to Razorpay adapter - single point of integration
 * When PayPal API changes, only this file changes
 */

const axios = require('axios');
const logger = require('../../../../utils/logger');
const { AppError } = require('../../../../middleware/errorHandler');

// Initialize PayPal client
const paypalClient = axios.create({
    baseURL: process.env.PAYPAL_MODE === 'sandbox'
        ? 'https://api.sandbox.paypal.com'
        : 'https://api.paypal.com',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PAYPAL_ACCESS_TOKEN}`,
    },
});

/**
 * Create PayPal order
 * @param {number} amount - Amount in INR
 * @param {string} bookingId - Booking reference
 * @param {object} customerDetails - { name, email, phone }
 * @returns {Promise}
 */
const createOrder = async (amount, bookingId, customerDetails) => {
    try {
        logger.info(`[PayPal Adapter] Creating order: ${bookingId}`);

        // TODO: Implement PayPal API call
        // const response = await paypalClient.post('/v2/checkout/orders', {
        //   intent: 'CAPTURE',
        //   purchase_units: [{
        //     amount: {
        //       currency_code: 'INR',
        //       value: amount.toString(),
        //     },
        //     description: `Booking #${bookingId}`,
        //     payee: {
        //       name: customerDetails.name,
        //       email: customerDetails.email,
        //     },
        //   }],
        //   payer: {
        //     name: { given_name: customerDetails.name },
        //     email_address: customerDetails.email,
        //     phone: { phone_number: { national_number: customerDetails.phone } },
        //   },
        // });

        // return {
        //   orderId: response.data.id,
        //   amountInINR: amount,
        //   currency: 'INR',
        // };

        throw new AppError('PayPal adapter not yet implemented', 501);
    } catch (error) {
        logger.error(`[PayPal Adapter] Create order failed: ${error.message}`);
        throw error;
    }
};

/**
 * Capture PayPal payment
 * @param {string} orderId - PayPal order ID
 * @param {object} details - Capture details
 * @returns {Promise}
 */
const capturePayment = async (orderId, details) => {
    try {
        logger.info(`[PayPal Adapter] Capturing order: ${orderId}`);

        // TODO: Implement PayPal capture API call
        // const response = await paypalClient.post(`/v2/checkout/orders/${orderId}/capture`, {
        //   payment_source: {
        //     paypal: {},
        //   },
        // });

        // return {
        //   transactionId: response.data.purchase_units[0].payments.captures[0].id,
        //   status: response.data.status,
        // };

        throw new AppError('PayPal adapter not yet implemented', 501);
    } catch (error) {
        logger.error(`[PayPal Adapter] Capture payment failed: ${error.message}`);
        throw error;
    }
};

/**
 * Refund PayPal payment
 * @param {string} captureId - PayPal capture/transaction ID
 * @param {number} amount - Refund amount in INR
 * @param {string} reason
 * @returns {Promise}
 */
const refundPayment = async (captureId, amount, reason = 'Refund requested') => {
    try {
        logger.info(`[PayPal Adapter] Refunding capture: ${captureId}`);

        // TODO: Implement PayPal refund API call
        // const response = await paypalClient.post(
        //   `/v2/payments/captures/${captureId}/refund`,
        //   {
        //     amount: {
        //       currency_code: 'INR',
        //       value: amount.toString(),
        //     },
        //     note_to_payer: reason,
        //   }
        // );

        // return {
        //   refundId: response.data.id,
        //   status: response.data.status,
        // };

        throw new AppError('PayPal adapter not yet implemented', 501);
    } catch (error) {
        logger.error(`[PayPal Adapter] Refund failed: ${error.message}`);
        throw error;
    }
};

/**
 * Get payment details
 * @param {string} orderId - PayPal order ID
 * @returns {Promise}
 */
const getPaymentDetails = async (orderId) => {
    try {
        logger.info(`[PayPal Adapter] Fetching order: ${orderId}`);

        // TODO: Implement PayPal details fetch
        // const response = await paypalClient.get(`/v2/checkout/orders/${orderId}`);
        // return response.data;

        throw new AppError('PayPal adapter not yet implemented', 501);
    } catch (error) {
        logger.error(`[PayPal Adapter] Get details failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createOrder,
    capturePayment,
    refundPayment,
    getPaymentDetails,
};
