/**
 * ─── PAYPAL ADAPTER ──────────────────────────────────
 * Handles all PayPal API calls
 * 
 * This is the SINGLE POINT OF INTEGRATION with PayPal REST API
 * Production-level gateway adapter
 */

const axios = require('axios');
const logger = require('../../../../utils/logger');
const { AppError } = require('../../../../middleware/errorHandler');

// Initialize PayPal client base
const paypalClient = axios.create({
    baseURL: process.env.PAYPAL_MODE === 'production'
        ? 'https://api.paypal.com'
        : 'https://api.sandbox.paypal.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

let tokenCache = {
    token: null,
    expiresAt: null
};

/**
 * Fetch dynamic OAuth2 Access Token for PayPal API
 * @returns {Promise<string>}
 */
const getAccessToken = async () => {
    if (tokenCache.token && tokenCache.expiresAt > Date.now()) {
        return tokenCache.token;
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new AppError('PayPal credentials (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are not configured in environment variables.', 500);
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const url = process.env.PAYPAL_MODE === 'production'
        ? 'https://api.paypal.com/v1/oauth2/token'
        : 'https://api.sandbox.paypal.com/v1/oauth2/token';
    
    try {
        const response = await axios.post(url, 'grant_type=client_credentials', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${auth}`,
            },
        });

        tokenCache.token = response.data.access_token;
        // Expire 5 minutes early to prevent race conditions
        tokenCache.expiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
        return tokenCache.token;
    } catch (error) {
        logger.error(`[PayPal Adapter] OAuth authentication failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        throw new AppError(`PayPal Authentication failed: ${error.response?.data?.error_description || error.message}`, 500);
    }
};

/**
 * Create PayPal Order
 * @param {number} amount - Amount to charge
 * @param {string} bookingId - Internal booking ID reference
 * @param {object} customerDetails - { name, email, phone }
 * @returns {Promise<object>} Order details
 */
const createOrder = async (amount, bookingId, customerDetails = {}) => {
    try {
        logger.info(`[PayPal Adapter] Creating order for booking: ${bookingId}, amount: ${amount}`);
        
        const token = await getAccessToken();
        const currency = process.env.PAYPAL_CURRENCY || 'USD';

        const response = await paypalClient.post('/v2/checkout/orders', 
            {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2),
                    },
                    description: `Travel Booking #${bookingId}`,
                    custom_id: bookingId,
                    reference_id: `booking_${bookingId}`,
                }],
                application_context: {
                    brand_name: 'Maqam Travels',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/paypal/success?bookingId=${bookingId}`,
                    cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/paypal/cancel?bookingId=${bookingId}`,
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        logger.info(`[PayPal Adapter] Order created: ${response.data.id}`);

        const approveLink = response.data.links.find(link => link.rel === 'approve')?.href;

        return {
            orderId: response.data.id,
            amount,
            currency,
            status: response.data.status,
            redirectUrl: approveLink || '',
            links: response.data.links,
        };
    } catch (error) {
        logger.error(`[PayPal Adapter] Create order failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        throw new AppError(
            `Failed to create PayPal payment order: ${error.response?.data?.message || error.message}`,
            error.response?.status || 500
        );
    }
};

/**
 * Capture Authorized PayPal Payment Order
 * @param {string} orderId - PayPal Order ID
 * @returns {Promise<object>} Capture details
 */
const capturePayment = async (orderId) => {
    try {
        logger.info(`[PayPal Adapter] Capturing order: ${orderId}`);
        
        const token = await getAccessToken();

        const response = await paypalClient.post(`/v2/checkout/orders/${orderId}/capture`, 
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        logger.info(`[PayPal Adapter] Order captured successfully: ${orderId}`);

        const purchaseUnit = response.data.purchase_units?.[0];
        const capture = purchaseUnit?.payments?.captures?.[0];

        if (!capture) {
            throw new AppError('No capture found in PayPal capture response', 500);
        }

        return {
            transactionId: capture.id,
            status: response.data.status,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code,
        };
    } catch (error) {
        logger.error(`[PayPal Adapter] Capture failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        throw new AppError(
            `Failed to capture PayPal payment: ${error.response?.data?.message || error.message}`,
            error.response?.status || 500
        );
    }
};

/**
 * Refund Captured PayPal Payment
 * @param {string} captureId - PayPal Capture ID (stored in transactionId/paypalCaptureId)
 * @param {number} amount - Amount in original currency (optional, full refund if omitted)
 * @param {string} reason - Refund reason
 * @returns {Promise<object>} Refund details
 */
const refundPayment = async (captureId, amount, reason = 'Booking cancelled') => {
    try {
        logger.info(`[PayPal Adapter] Processing refund for capture: ${captureId}`);
        
        const token = await getAccessToken();
        const payload = {};

        if (amount) {
            payload.amount = {
                value: amount.toFixed(2),
                currency_code: process.env.PAYPAL_CURRENCY || 'USD',
            };
        }
        if (reason) {
            payload.note_to_payer = reason;
        }

        const response = await paypalClient.post(`/v2/payments/captures/${captureId}/refund`, 
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        logger.info(`[PayPal Adapter] Refund created successfully: ${response.data.id}`);

        return {
            refundId: response.data.id,
            status: response.data.status,
            amount: response.data.amount ? parseFloat(response.data.amount.value) : amount,
        };
    } catch (error) {
        logger.error(`[PayPal Adapter] Refund failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        throw new AppError(
            `Failed to process PayPal refund: ${error.response?.data?.message || error.message}`,
            error.response?.status || 500
        );
    }
};

/**
 * Get Order Details from PayPal
 * @param {string} orderId - PayPal Order ID
 * @returns {Promise<object>} Order details
 */
const getPaymentDetails = async (orderId) => {
    try {
        logger.info(`[PayPal Adapter] Fetching details for order: ${orderId}`);
        
        const token = await getAccessToken();

        const response = await paypalClient.get(`/v2/checkout/orders/${orderId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        logger.error(`[PayPal Adapter] Fetch details failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
        throw new AppError(
            `Failed to fetch PayPal order details: ${error.response?.data?.message || error.message}`,
            error.response?.status || 500
        );
    }
};

module.exports = {
    createOrder,
    capturePayment,
    refundPayment,
    getPaymentDetails,
};
