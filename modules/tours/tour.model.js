const mongoose = require('mongoose');
const { TOUR_STATUS } = require('../../config/constants');

/**
 * ─── TOUR MODEL (Custom Tour Schema) ────────────────────
 * Stores custom tour requests — draft → submit → quote → book workflow
 */

const tourSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Tour details
    title: {
      type: String,
      required: true,
    },
    destination: String,
    startDate: Date,
    endDate: Date,
    duration: Number, // in days
    budget: Number,
    currency: {
      type: String,
      default: 'USD',
    },
    // Detailed itinerary
    itinerary: [
      {
        day: Number,
        activity: String,
        notes: String,
      },
    ],
    // Requirements
    accommodationType: String,
    meals: String,
    specialRequests: String,
    transportationPreference: String,
    // Status tracking
    status: {
      type: String,
      enum: Object.values(TOUR_STATUS),
      default: TOUR_STATUS.DRAFT,
    },
    submittedAt: Date,
    // Agent info (assigned when reviewed)
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Quote from agent
    quotedPrice: Number,
    quotedAt: Date,
    quotedExpiresAt: Date,
    // Booking reference
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    // Cancellation
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
tourSchema.index({ userId: 1 });
tourSchema.index({ status: 1 });
tourSchema.index({ startDate: 1 });
tourSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Tour', tourSchema);
