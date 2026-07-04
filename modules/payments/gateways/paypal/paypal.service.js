const Payment = require('../../payment.model');
const FlightBooking = require('../../../flights/flight.model');
const HotelBooking = require('../../../hotels/hotel.model');
const paypalClient = require('./paypal.client');
const logger = require('../../../../utils/logger');
const { AppError } = require('../../../../middleware/errorHandler');
const { PAYMENT_STATUS } = require('../../../../config/constants');

/**
 * ─── PAYPAL SERVICE ──────────────────────────────────
 * PayPal-specific payment business logic
 * 
 * Similar to razorpay.service.js
 * Mirror the functions but adapt for PayPal's order/capture flow
 */

/**
 * Create PayPal Order for a booking
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} bookingType
 * @returns {Promise}
 */
const createPaymentOrder = async (userId, bookingId, bookingType) => {
    try {
        logger.info(`[PayPal Service] Creating payment order - User: ${userId}, Booking: ${bookingId}`);

        // 1. Fetch booking details
        let booking;
        if (bookingType === 'flight') {
            booking = await FlightBooking.findById(bookingId).populate('user', 'email phone name');
        } else if (bookingType === 'hotel') {
            booking = await HotelBooking.findById(bookingId).populate('user', 'email phone name');
        }

        if (!booking) {
            throw new AppError('Booking not found', 404);
        }

        if (booking.user._id.toString() !== userId) {
            throw new AppError('Unauthorized to pay for this booking', 403);
        }

        // 2. Check if already paid
        const existingPayment = await Payment.findOne({
            bookingId,
            status: PAYMENT_STATUS.PAID,
        });

        if (existingPayment) {
            throw new AppError('This booking is already paid', 400);
        }

        // 3. Get amount
        const amount = booking.totalAmount || 0;
        if (amount <= 0) {
            throw new AppError('Invalid booking amount', 400);
        }

        // 4. Create PayPal order
        const orderData = await paypalClient.orders.create(
            amount,
            bookingId,
            {
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone,
            }
        );

        // 5. Create Payment record
        const payment = await Payment.create({
            userId,
            bookingId,
            bookingType,
            amount,
            currency: 'INR',
            paymentMethod: 'paypal',
            paypalOrderId: orderData.orderId,
            status: PAYMENT_STATUS.PENDING,
        });

        logger.info(`[PayPal Service] Payment order created - ID: ${payment._id}`);

        return {
            paymentId: payment._id,
            paypalOrderId: orderData.orderId,
            amount,
            currency: 'INR',
            bookingId,
            bookingType,
        };
    } catch (error) {
        logger.error(`[PayPal Service] Payment order creation failed: ${error.message}`);
        throw error;
    }
};

/**
 * Capture and verify PayPal payment
 * @param {string} orderId - PayPal order ID
 * @returns {Promise}
 */
const captureAndVerifyPayment = async (orderId) => {
    try {
        logger.info(`[PayPal Service] Capturing PayPal order: ${orderId}`);

        // 1. Capture the payment
        const captureData = await paypalClient.orders.capture(orderId, {});

        // 2. Find and update payment record
        const payment = await Payment.findOneAndUpdate(
            { paypalOrderId: orderId },
            {
                paypalCaptureId: captureData.transactionId,
                status: PAYMENT_STATUS.PAID,
                verifiedAt: new Date(),
                transactionId: captureData.transactionId,
            },
            { new: true }
        )
            .populate('bookingId')
            .populate('userId', 'email phone name');

        if (!payment) {
            throw new AppError('Payment record not found', 404);
        }

        logger.info(`[PayPal Service] Payment captured - ID: ${payment._id}`);

        return {
            paymentId: payment._id,
            paypalCaptureId: captureData.transactionId,
            status: payment.status,
        };
    } catch (error) {
        logger.error(`[PayPal Service] Payment capture failed: ${error.message}`);
        throw error;
    }
};

/**
 * Process successful payment
 * @param {string} paymentId
 * @returns {Promise}
 */
const processSuccessfulPayment = async (paymentId) => {
    try {
        logger.info(`[PayPal Service] Processing successful payment: ${paymentId}`);

        // 1. Get payment details
        const payment = await Payment.findById(paymentId)
            .populate('bookingId')
            .populate('userId', 'email phone name');

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        // 2. Update booking
        const booking = payment.bookingId;
        booking.status = 'confirmed';
        booking.paypalPaymentId = payment.paypalCaptureId;
        await booking.save();

        logger.info(`[PayPal Service] Booking confirmed - ID: ${booking._id}`);

        // TODO: Call GDS ticketing, send notifications

        return {
            success: true,
            paymentId: payment._id,
            bookingId: booking._id,
            status: 'confirmed',
        };
    } catch (error) {
        logger.error(`[PayPal Service] Payment processing failed: ${error.message}`);
        throw error;
    }
};

/**
 * Refund payment
 * @param {string} paymentId
 * @param {number} amount
 * @param {string} reason
 * @returns {Promise}
 */
const refundPayment = async (paymentId, amount, reason = 'Booking cancelled') => {
    try {
        logger.info(`[PayPal Service] Processing refund for payment: ${paymentId}`);

        const payment = await Payment.findById(paymentId);

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        if (payment.status !== PAYMENT_STATUS.PAID) {
            throw new AppError('Only paid payments can be refunded', 400);
        }

        // Call PayPal refund
        const refundAmount = amount || payment.amount;
        const refundData = await paypalClient.payments.refund(
            payment.paypalCaptureId,
            refundAmount,
            reason
        );

        // Update payment record
        payment.status = PAYMENT_STATUS.REFUNDED;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundProcessedAt = new Date();
        payment.refundRefId = refundData.refundId;
        await payment.save();

        logger.info(`[PayPal Service] Refund processed - Refund ID: ${refundData.refundId}`);

        return {
            paymentId: payment._id,
            refundId: refundData.refundId,
            amount: refundData.amount,
            status: refundData.status,
        };
    } catch (error) {
        logger.error(`[PayPal Service] Refund failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createPaymentOrder,
    captureAndVerifyPayment,
    processSuccessfulPayment,
    refundPayment,
};
