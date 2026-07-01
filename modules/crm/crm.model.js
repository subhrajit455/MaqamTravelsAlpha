const mongoose = require('mongoose');
const { LEAD_STATUS } = require('../../config/constants');

/**
 * ─── CRM MODEL (Lead Schema) ───────────────────────────
 * Tracks sales leads and conversions
 * For admin/sales agent use only
 */

const leadSchema = new mongoose.Schema(
  {
    // Lead info
    firstName: {
      type: String,
      required: true,
    },
    lastName: String,
    email: {
      type: String,
      required: true,
    },
    phone: String,
    // Source of lead
    source: {
      type: String,
      enum: ['website', 'referral', 'email', 'phone', 'social', 'other'],
      default: 'website',
    },
    // Interest details
    destination: String,
    travelDates: {
      from: Date,
      to: Date,
    },
    budget: Number,
    numberOfPeople: Number,
    specialRequests: String,
    // Lead status & management
    status: {
      type: String,
      enum: Object.values(LEAD_STATUS),
      default: LEAD_STATUS.NEW,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Follow-up tracking
    lastContactDate: Date,
    nextFollowUpDate: Date,
    contactNotes: String,
    // Quote info
    quotedPrice: Number,
    quoteExpiresAt: Date,
    // Conversion
    convertedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    convertedAt: Date,
    // If lost
    lostReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
leadSchema.index({ assignedAgent: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
