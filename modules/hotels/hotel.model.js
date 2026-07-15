const mongoose = require('mongoose');

/**
 * ─── HOTEL MODEL (Hotel Booking Schema) ────────────────
 * Stores booking references only, not hotel inventory
 * Inventory comes from SRDV API
 */

const hotelBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // SRDV hotel ID (external reference)
    srdvHotelId: {
      type: String,
      required: true,
    },
    // Hotel details snapshot at booking time
    hotelName: String,
    destination: String,
    checkIn: Date,
    checkOut: Date,
    roomType: String,
    pricePerNight: Number,
    totalNights: Number,
    totalPrice: Number,
    currency: String,
    // Booking status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    // Booking reference from SRDV
    srdvBookingRef: String,
    // Guest details
    guestName: String,
    guestEmail: String,
    guestPhone: String,
    // Special requests
    specialRequests: String,
    // Cancellation policy
    cancellationPolicy: String,
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
hotelBookingSchema.index({ userId: 1 });
hotelBookingSchema.index({ srdvHotelId: 1 });
hotelBookingSchema.index({ checkIn: 1 });
hotelBookingSchema.index({ status: 1 });

module.exports = mongoose.model('HotelBooking', hotelBookingSchema);
