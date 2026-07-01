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
    // Payment details
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    // Payment gateway
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay', 'paypal', 'bank_transfer'],
      required: true,
    },
    transactionId: String,
    // Status
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    // Timestamps
    verifiedAt: Date,
    // Refund info
    refundAmount: Number,
    refundReason: String,
    refundRequestedAt: Date,
    refundProcessedAt: Date,
    // Metadata
    metadata: {
      invoiceNumber: String,
      notes: String,
    },
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
