const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../../config/constants');

/**
 * ─── PAYMENT MODEL (Payment Schema) ────────────────────
 * Tracks all payments for bookings
 */

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Booking reference
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    // Booking type (for multi-type bookings)
    bookingType: {
      type: String,
      enum: ['flight', 'hotel', 'tour', 'package'],
      required: true,
    },
    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    // Payment gateway
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'phonepe', 'paypal', 'stripe', 'bank_transfer'],
      required: true,
    },
    // Razorpay specific fields
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    transactionId: String,

    // PayPal specific fields
    paypalOrderId: {
      type: String,
      index: true,
    },
    paypalCaptureId: String,
    paypalTransactionId: String,

    // PhonePe specific fields
    phonePeTransactionId: {
      type: String,
      index: true,
    },

    // Payment method details
    paymentDetails: {
      method: String, // 'card', 'upi', 'netbanking', 'wallet'
      cardLast4: String,
      vpa: String,    // For UPI
      bankName: String,
      acquirerName: String,
    },
    // Status
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    failureReason: String,
    // Timestamps
    verifiedAt: Date,
    // Refund info
    refundRefId: String,
    refundAmount: Number,
    refundReason: String,
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    // Metadata
    metadata: {
      invoiceNumber: String,
      notes: String,
    },
    notes: mongoose.Schema.Types.Mixed, // Store webhook notes
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ userId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
