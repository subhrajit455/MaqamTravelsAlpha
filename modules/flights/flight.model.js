const mongoose = require('mongoose');

/**
 * ─── FLIGHT MODEL (Flight Booking Schema) ─────────────
 * Stores booking references only, not flight inventory
 * Inventory comes from SRDV API
 */

const flightBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // SRDV flight ID (external reference)
    srdvFlightId: {
      type: String,
      required: true,
    },
    // Flight details snapshot at booking time
    airline: String,
    flightNumber: String,
    departure: String,
    arrival: String,
    departTime: Date,
    arrivalTime: Date,
    duration: Number, // in minutes
    price: Number,
    currency: String,
    seatClass: {
      type: String,
      enum: ['economy', 'business', 'firstclass'],
    },
    // Booking status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Booking reference from SRDV
    srdvBookingRef: String,
    // Passenger details
    passengers: [
      {
        name: String,
        email: String,
        phone: String,
        dateOfBirth: Date,
        passport: String,
      },
    ],
    // Baggage info
    baggageAllowance: String,
    // Payment info (linked to Payment module)
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
flightBookingSchema.index({ userId: 1 });
flightBookingSchema.index({ srdvFlightId: 1 });
flightBookingSchema.index({ departTime: 1 });
flightBookingSchema.index({ status: 1 });

module.exports = mongoose.model('FlightBooking', flightBookingSchema);
