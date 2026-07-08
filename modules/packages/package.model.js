const mongoose = require('mongoose');

/**
 * ─── PACKAGE MODEL (Pre-built Tour Package Schema) ────
 * Stores curated tour packages that users can book directly
 */
const FlightSchema = new mongoose.Schema({
  arrival: {
    type: String,
    required: true},
    departure: {type:string, required:true},
    flightNumber: {type:string, required:true},
    airline: {type:string, required:true},
    price: {type:number, required:true},
    nameAdditionDeadline: {type:date },
    
    
})
const packageSchema = new mongoose.Schema(
  {
    // Package info
    name: {
      type: String,
      required: true,
    },
    description: String,
    destination: {
      type: String,
      required: true,
    },
    // Duration & dates
    duration: {
      type: Number, // in days
      required: true,
    },
    startDate: Date,
    endDate: Date,
    // Pricing
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    // Itinerary
    itinerary: [
      {
        day: Number,
        activity: String,
        accommodation: String,
        meals: String,
      },
    ],
    // Inclusions & exclusions
    inclusions: [String],
    exclusions: [String],
    // Availability
    maxParticipants: Number,
    currentParticipants: {
      type: Number,
      default: 0,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    imageUrls: [String],
    // Created by (admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
packageSchema.index({ destination: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ isActive: 1 });
packageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Package', packageSchema);
