// modules/packages/hotelStock.model.js
//
// Hotel counterpart to ticketStock.model.js. Kept as its own model rather than folding into
// one "type"-discriminated collection — flight and hotel inventory don't share enough real
// fields to justify that (would mean a pile of fields irrelevant to whichever type a given
// doc isn't). Same underlying pattern though: a shared block reservation admin bought in
// bulk, a pool of interchangeable units, guest names added later, outside this system.
//
// Field names deliberately mirror ticketStock.model.js wherever the concept is analogous
// (nameAdditionDeadline, units[], createdBy, status enum) so shared controller logic later
// — "check the deadline, then claim a unit" — doesn't need type-specific branching.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const HotelUnitSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["available", "assigned", "used"],
      default: "available",
    },
    guestConfirmationRef: { type: String, default: null }, 
    assignedToBooking: { type: Schema.Types.ObjectId, default: null },
    assignedToBookingModel: {
      type: String,
      enum: ["PackageBooking", "OfferBooking"],
      default: null,
    },
    assignedAt: Date,
  },
  { _id: true },
);

const HotelStockSchema = new Schema(
  {
    // --- Shared across every unit in this batch ---
    hotelName: { type: String, required: true },
    destination: { type: String, required: true }, // city-level, matches the detail level
    // Package's customer-facing view already works with
    roomType: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    pricePerNight: { type: Number, required: true }, // admin's actual bulk cost per night —
    
    meals: [{type: String, enum: ["breakfast", "lunch", "dinner"]}],


    // --- Block booking mechanics ---
    reservationRef: { type: String, required: true }, // hotel's block booking confirmation —
    // hotel-side equivalent of a shared flight PNR
    nameAdditionDeadline: { type: Date, required: true }, // rooming-list-due-by date — most
    // hotel block deals require guest names submitted by a cutoff before arrival or the
    // allocation is forfeited. Same role TicketStock.nameAdditionDeadline plays for flights.

    units: {
      type: [HotelUnitSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "HotelStock must have at least one unit",
      },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Derived, not stored — same rule applied throughout this module: anything computable from
// source fields shouldn't also be an independently-editable number that can drift from them.
HotelStockSchema.virtual("totalNights").get(function () {
  if (!this.checkIn || !this.checkOut) return 0;
  const msPerNight = 1000 * 60 * 60 * 24;
  return Math.round((this.checkOut - this.checkIn) / msPerNight);
});
HotelStockSchema.virtual("costPerUnit").get(function () {
  return this.pricePerNight * this.totalNights;
});
HotelStockSchema.virtual("totalUnits").get(function () {
  return this.units.length;
});
HotelStockSchema.virtual("availableUnits").get(function () {
  return this.units.filter((u) => u.status === "available").length;
});

HotelStockSchema.set("toJSON", { virtuals: true });
HotelStockSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("HotelStock", HotelStockSchema);
