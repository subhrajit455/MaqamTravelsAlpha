// modules/packages/package.model.js
//
// References TicketStock/HotelStock rather than embedding — see the top of those two files
// for why (inventory is shared across possibly multiple packages, so it can't be copied in).
//
// TWO DELIBERATE DEPARTURES from the original travel-platform-backend-plan.md draft:
//
// 1. No inventory/allocated/sold fields here anymore. Availability is now entirely a
//    function of the referenced stock's availableUnits (see ticketStock.model.js /
//    hotelStock.model.js virtuals) — a separate counter on Package would be a second source
//    of truth that could disagree with the stock it's meant to reflect. Real availability =
//    min across every referenced stock of floor(stock.availableUnits / unitsPerBooking),
//    computed by the service layer on read, not stored on this document.
//
// 2. No stored costPrice. Computing it needs cross-document reads (TicketStock.costPerUnit /
//    HotelStock.costPerUnit — both can change after this Package was created), so storing it
//    risks silent drift the moment admin edits a stock's cost without also re-saving every
//    Package that references it. Exposed instead as a service-level calculation (populate
//    refs, sum costs) for admin's internal profitability view — never sent to the customer
//    either way, same as costPrice always was.

const mongoose = require("mongoose");
const { Schema } = mongoose;

const FlightRefSchema = new Schema(
  {
    stock: { type: Schema.Types.ObjectId, ref: "TicketStock", required: true },
    // How many units of the referenced stock ONE booking of this package consumes.
    // KNOWN SIMPLIFICATION: doesn't handle shared-resource cases (e.g. "2 travellers per
    // hotel room, 1 flight seat each"). If a package needs that, model its sellable unit as
    // the whole group (e.g. "package for 2") rather than expressing fractional consumption
    // here. Revisit only if a real package needs true per-traveller splitting.
    unitsPerBooking: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const HotelRefSchema = new Schema(
  {
    stock: { type: Schema.Types.ObjectId, ref: "HotelStock", required: true },
    unitsPerBooking: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// Internal, cost-side extras that aren't backed by tracked stock (guide, transport, etc.) —
// treated as always-available/service-based, no unit consumption to worry about.
const OtherItemSchema = new Schema(
  { label: { type: String, required: true }, cost: { type: Number, required: true } },
  { _id: false }
);

const ItineraryDaySchema = new Schema(
  { day: { type: Number, required: true }, description: String },
  { _id: false }
);

const PackageSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    destination: { type: String, required: true },
    images: [String],

    flightRefs: [FlightRefSchema],
    hotelRefs: [HotelRefSchema],
    otherItems: [OtherItemSchema],

    sellPrice: Number, //k

    inclusions: [String],
    itinerary: [ItineraryDaySchema],
    validity: { from: Date, to: Date },

    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true }, // false = agent-sell only, per original plan

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Package", PackageSchema);