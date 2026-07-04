const Payment = require("../../payment.model");
const FlightBooking = require("../../../flights/flight.model");
const HotelBooking = require("../../../hotels/hotel.model");
const razorpayClient = require('./razorpay.client');
const logger = require('../../../../utils/logger');
const { AppError } = require('../../../../middleware/errorHandler');
const { PAYMENT_STATUS } = require('../../../../config/constants');

/**
 * ─── RAZORPAY SERVICE ──────────────────────────────────
 * Razorpay-specific payment business logic
 * Bridges Payment Service with Razorpay Adapter
 */

/**
 * Create Razorpay Order for a booking
 * @param {string} userId
 * @param {string} bookingId
 * @param {string} bookingType - 'flight', 'hotel', 'tour', 'package'
 * @returns {Promise} Payment document with order details
 */
const createPaymentOrder = async (userId, bookingId, bookingType) => {
    try {
        logger.info(`[Razorpay Service] Creating payment order - User: ${userId}, Booking: ${bookingId}, Type: ${bookingType}`);

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

        // 3. Get amount from booking
        const amount = booking.totalAmount || 0;

        if (amount <= 0) {
            throw new AppError('Invalid booking amount', 400);
        }

        // 4. Create Razorpay order
        const orderData = await razorpayClient.orders.create(
            amount,
            bookingId,
            {
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone,
            }
        );

        // 5. Create Payment record in DB
        const payment = await Payment.create({
            userId,
            bookingId,
            bookingType,
            amount,
            currency: 'INR',
            paymentMethod: 'razorpay',
            razorpayOrderId: orderData.orderId,
            status: PAYMENT_STATUS.PENDING,
        });

        logger.info(`[Razorpay Service] Payment order created - ID: ${payment._id}, Razorpay Order: ${orderData.orderId}`);

        return {
            paymentId: payment._id,
            razorpayOrderId: orderData.orderId,
            amount: orderData.amountInINR,
            currency: orderData.currency,
            keyId: process.env.RAZORPAY_KEY_ID, // Send to frontend for checkout
            bookingId,
            bookingType,
            customerDetails: {
                name: booking.user.name,
                email: booking.user.email,
                phone: booking.user.phone,
            },
        };
    } catch (error) {
        logger.error(`[Razorpay Service] Payment order creation failed: ${error.message}`);
        throw error;
    }
};

/**
 * Verify and Process Payment (called from webhook)
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Webhook signature
 * @returns {Promise} Payment details
 */
const verifyAndProcessPayment = async (orderId, paymentId, signature) => {
    try {
        logger.info(`[Razorpay Service] Verifying payment - Order: ${orderId}, Payment: ${paymentId}`);

        // 1. Verify signature
        const isValid = razorpayClient.payments.verify(orderId, paymentId, signature);

        if (!isValid) {
            logger.warn(`[Razorpay Service] Invalid payment signature for order: ${orderId}`);
            throw new AppError('Payment verification failed', 400);
        }

        // 2. Fetch payment details from Razorpay
        const paymentDetails = await razorpayClient.payments.fetch(paymentId);

        // 3. Update Payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId: orderId },
            {
                razorpayPaymentId: paymentId,
                status: paymentDetails.status === 'captured' ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
                verifiedAt: new Date(),
                transactionId: paymentId,
                paymentMethod: paymentDetails.method,
                notes: paymentDetails.notes,
            },
            { new: true }
        )
            .populate('bookingId')
            .populate('userId', 'email phone name');

        if (!payment) {
            throw new AppError('Payment record not found', 404);
        }

        logger.info(`[Razorpay Service] Payment verified - ID: ${payment._id}, Status: ${payment.status}`);

        return {
            paymentId: payment._id,
            razorpayPaymentId,
            orderId,
            amount: payment.amount,
            status: payment.status,
            bookingId: payment.bookingId._id,
            bookingType: payment.bookingType,
            verifiedAt: payment.verifiedAt,
        };
    } catch (error) {
        logger.error(`[Razorpay Service] Payment verification failed: ${error.message}`);
        throw error;
    }
};

/**
 * Process successful payment (after verification)
 * Coordinates with flight booking to ticket
 * @param {string} paymentId - Internal payment ID
 * @returns {Promise}
 */
const processSuccessfulPayment = async (paymentId) => {
    try {
        logger.info(`[Razorpay Service] Processing successful payment: ${paymentId}`);

        // 1. Get payment details
        const payment = await Payment.findById(paymentId)
            .populate('bookingId')
            .populate('userId', 'email phone name');

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        if (payment.status !== PAYMENT_STATUS.PAID) {
            throw new AppError('Payment is not confirmed', 400);
        }

        // 2. Update booking status
        const booking = payment.bookingId;
        booking.status = 'confirmed';
        booking.razorpayPaymentId = payment.razorpayPaymentId;
        await booking.save();

        logger.info(`[Razorpay Service] Booking confirmed - ID: ${booking._id}`);

        // 3. TODO: Call GDS ticketing API if needed
        // const ticketingResult = await callGDSTicketing(booking);

        // 4. TODO: Send confirmation email/SMS
        // await sendConfirmationNotifications(booking, payment.userId);

        return {
            success: true,
            paymentId: payment._id,
            bookingId: booking._id,
            status: 'confirmed',
        };
    } catch (error) {
        logger.error(`[Razorpay Service] Payment processing failed: ${error.message}`);
        throw error;
    }
};

/**
 * Refund a payment
 * @param {string} paymentId - Internal payment ID
 * @param {number} amount - Optional partial refund amount
 * @param {string} reason
 * @returns {Promise}
 */
const refundPayment = async (paymentId, amount, reason = 'Booking cancelled') => {
    try {
        logger.info(`[Razorpay Service] Processing refund for payment: ${paymentId}`);

        // 1. Get payment details
        const payment = await Payment.findById(paymentId);

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        if (payment.status !== PAYMENT_STATUS.PAID) {
            throw new AppError('Only paid payments can be refunded', 400);
        }

        // 2. Call Razorpay refund
        const refundAmount = amount || payment.amount;
        const refundData = await razorpayClient.payments.refund(
            payment.razorpayPaymentId,
            refundAmount,
            reason
        );

        // 3. Update payment record
        payment.status = PAYMENT_STATUS.REFUNDED;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundProcessedAt = new Date();
        payment.refundRefId = refundData.refundId;
        await payment.save();

        logger.info(`[Razorpay Service] Refund processed - Refund ID: ${refundData.refundId}`);

        return {
            paymentId: payment._id,
            refundId: refundData.refundId,
            amount: refundData.amount,
            status: refundData.status,
        };
    } catch (error) {
        logger.error(`[Razorpay Service] Refund failed: ${error.message}`);
        throw error;
    }
};

/**
 * Get payment status
 * @param {string} paymentId - Internal payment ID
 * @returns {Promise}
 */
const getPaymentStatus = async (paymentId) => {
    try {
        const payment = await Payment.findById(paymentId).populate('bookingId');

        if (!payment) {
            throw new AppError('Payment not found', 404);
        }

        return {
            paymentId: payment._id,
            razorpayOrderId: payment.razorpayOrderId,
            razorpayPaymentId: payment.razorpayPaymentId,
            amount: payment.amount,
            status: payment.status,
            bookingStatus: payment.bookingId.status,
            verifiedAt: payment.verifiedAt,
            createdAt: payment.createdAt,
        };
    } catch (error) {
        logger.error(`[Razorpay Service] Get payment status failed: ${error.message}`);
        throw error;
    }
};

module.exports = {
    createPaymentOrder,
    verifyAndProcessPayment,
    processSuccessfulPayment,
    refundPayment,
    getPaymentStatus,
};
