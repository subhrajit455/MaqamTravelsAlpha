// modules/packages/ticketStock.model.js
//
// Represents a batch of block/series-fare tickets admin bought in bulk under one shared
// PNR, unnamed until sold. Confirmed pattern from conversation: one PNR, N interchangeable
// seats, names get added to the real airline PNR by admin (outside this system) as units sell.
//
// Named generically ("TicketStock", not "FlightStock") on purpose — the same shape (shared
// reservation + a pool of interchangeable units) is very likely to fit hotel block-booking
// stock too, once that gets built. `type` already exists for that; only "flight" is wired up
// for now, no migration needed later to add "hotel".

const mongoose = require("mongoose");
const { Schema } = mongoose;

const TicketUnitSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["available", "assigned", "used"],
      default: "available",
    },
    // Stays null until admin manually adds the passenger's name to the real airline PNR
    // (a step that happens outside this system) and comes back to record the resulting
    // ticket number. "assigned" ≠ "used" for exactly this reason — see the open question
    // from earlier about whether "used" should be automatic-on-payment or admin-confirmed.
    ticketNumber: { type: String, default: null },

    // Reference only — no passenger name duplicated onto the unit. Same "PII lives on the
    // booking record, not copied elsewhere" rule already used for
    // FlightBooking.passengers[].travellerId.
    assignedToBooking: {
      type: Schema.Types.ObjectId,
      ref: "PackageBooking",
      default: null,
    },
    assignedAt: Date,
  },
  { _id: true } // each unit needs its own id — it's the thing /book will atomically claim
);

const TicketStockSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["flight"], // add "hotel" here when that module is built
      default: "flight",
      required: true,
    },

    // --- Shared across every unit in this batch — this is what makes them "countable" ---
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    origin: { type: String, required: true, uppercase: true }, // airport code, e.g. "DEL"
    destination: { type: String, required: true, uppercase: true },
    departureDate: { type: Date, required: true },
    arrivalDate: Date,
    cabinClass: String, // optional — block fares are usually one fixed cabin class

    // --- Block/series fare mechanics ---
    pnr: { type: String, required: true }, // shared group PNR, empty-named until assigned
    nameAdditionDeadline: { type: Date, required: true },
    // Airline's cutoff to add a name to this PNR before the seat is forfeited — same role
    // FlightBooking.lastTicketDate plays for GDS holds. /book must check this before
    // letting a unit be claimed, not just whether status === "available".

    costPerUnit: { type: Number, required: true },
    // Admin's actual bulk cost per seat — internal only, must never reach
    // GET /packages/:id or any customer-facing response.

    units: {
      type: [TicketUnitSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "TicketStock must have at least one unit",
      },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Derived, not stored — a manually-maintained counter can drift from what's actually in
// `units`; a computed value can't. Same reasoning as Package.sellPrice being derived from
// priceBreakdown rather than kept as an independently-editable number.
TicketStockSchema.virtual("totalUnits").get(function () {
  return this.units.length;
});
TicketStockSchema.virtual("availableUnits").get(function () {
  return this.units.filter((u) => u.status === "available").length;
});

TicketStockSchema.set("toJSON", { virtuals: true });
TicketStockSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("TicketStock", TicketStockSchema);