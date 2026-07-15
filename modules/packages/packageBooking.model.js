// modules/packages/packageBooking.model.js
//
// One document per customer purchase of a Package. Ties together everything decided during
// planning: which travellers are on this booking, which specific TicketStock/HotelStock
// units got claimed for it, and a frozen snapshot of what the customer actually bought (so
// a later admin edit to the Package never retroactively changes a past booking — same rule
// FlightBooking.eTicketData already follows).

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Which specific unit, out of which TicketStock document, got claimed for this booking.
// Stored here (forward reference) in addition to TicketStock.units[].assignedToBooking
// (backward reference) purely for lookup speed — "what did this booking claim" shouldn't
// require scanning every TicketStock document searching for a match.
const ClaimedFlightUnitSchema = new Schema(
  {
    stock: { type: Schema.Types.ObjectId, ref: "TicketStock", required: true },
    unitId: { type: Schema.Types.ObjectId, required: true }, // the specific TicketStock.units[]._id
  },
  { _id: false }
);

const ClaimedHotelUnitSchema = new Schema(
  {
    stock: { type: Schema.Types.ObjectId, ref: "HotelStock", required: true },
    unitId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const PackageBookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    // Lookup only — never re-read for pricing/itinerary after booking. Everything the
    // customer needs displayed lives in packageSnapshot below, not fetched live from here.

    packageSnapshot: Schema.Types.Mixed,
    // Frozen at booking time: title, priceBreakdown, itinerary, inclusions from Package,
    // PLUS the resolved flight/hotel detail from whichever TicketStock/HotelStock docs were
    // referenced (airline, flight number, dates, hotel name, room type — the actual trip
    // detail, not just the Package's own fields). Needed because Package.flightRefs/
    // hotelRefs are live references — if a stock record or the Package itself is edited
    // later, a past booking's snapshot must still show what the customer actually bought.

    travellers: [
      {
        travellerId: { type: Schema.Types.ObjectId, ref: "Traveller", required: true },
        isLead: { type: Boolean, default: false },
      },
    ],
    // Reference only, no name/DOB duplicated here — same PII rule as
    // FlightBooking.passengers[].travellerId. Which traveller's name ends up on which
    // specific claimed unit isn't tracked at this granularity (see claimedFlightUnits/
    // claimedHotelUnits below) — that matching happens manually, admin-side, when they
    // actually go add names to the real airline/hotel systems. Modeling a strict
    // traveller-to-unit mapping here would be more precision than the real-world process
    // actually has.

    quantity: { type: Number, required: true, min: 1 },
    // How many copies of the package this purchase covers. Units actually claimed per
    // stock ref = Package.flightRefs[i].unitsPerBooking * quantity (same multiplier
    // relationship on both models — see package.model.js's unitsPerBooking comment).

    claimedFlightUnits: [ClaimedFlightUnitSchema],
    claimedHotelUnits: [ClaimedHotelUnitSchema],
    // Populated at claim time by the (not yet built) atomic claim logic — this is what
    // /packages/:id/book actually reserves out of the shared TicketStock/HotelStock pools.

    totalAmount: { type: Number, required: true },
    // packageSnapshot.sellPrice * quantity, locked at booking time — immutable per the
    // "transactions are immutable" rule; a price change on Package after this point must
    // never affect an already-placed booking.

    status: {
      type: String,
      enum: ["initiated", "pending", "confirmed", "cancelled"],
      default: "initiated",
      // initiated: doc created, before any units claimed — crash-safety net, same as
      //            FlightBooking's "initiated" status
      // pending:   units claimed (held), payment not yet confirmed
      // confirmed: payment verified — e-ticket generation triggers from here
      // cancelled: refund path
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageBooking", PackageBookingSchema);