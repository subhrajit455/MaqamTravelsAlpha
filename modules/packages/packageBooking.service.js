const Package = require("../models/package.model");
const PackageBooking = require("../models/packageBooking.model");
const TicketStock = require("../models/ticketStock.model");
const HotelStock = require("../models/hotelStock.model");

const { claimAllForBooking, releaseUnit } = require("./stockClaim.service");
const { availabilityForPackage } = require("./availability.service");

/**
 * Create a PackageBooking:
 * 1. Load the package + populate its referenced stock
 * 2. Check availability actually covers the requested quantity
 * 3. Claim units atomically (across every flightRef/hotelRef)
 * 4. Create the booking with a frozen snapshot
 * 5. If anything after claiming fails, release the claimed units before
 *    re-throwing — the caller (controller) should never see a booking
 *    that holds units without a matching booking record, or vice versa.
 *
 * Payment is handled separately (Payments module) — this only creates the
 * booking in "initiated" status; the payment flow flips it to "confirmed".
 */
async function createPackageBooking({ userId, packageId, travellers, quantity }) {
  const pkg = await Package.findById(packageId)
    .populate("flightRefs.stock")
    .populate("hotelRefs.stock");

  if (!pkg || !pkg.isActive) {
    throw new Error("Package not found or not active.");
  }

  // Build a uniform ref list: { stockModel, stockDoc, stockId, unitsPerBooking }
  const refs = [
    ...pkg.flightRefs.map((r) => ({
      stockModel: TicketStock,
      stockDoc: r.stock,
      stockId: r.stock._id,
      unitsPerBooking: r.unitsPerBooking,
    })),
    ...pkg.hotelRefs.map((r) => ({
      stockModel: HotelStock,
      stockDoc: r.stock,
      stockId: r.stock._id,
      unitsPerBooking: r.unitsPerBooking,
    })),
  ];

  const availableBookings = availabilityForPackage(
    refs.map((r) => ({ stockDoc: r.stockDoc, unitsPerBooking: r.unitsPerBooking }))
  );

  if (availableBookings < quantity) {
    throw new Error(
      `Only ${availableBookings} booking(s) worth of stock left for this package.`
    );
  }

  // claimAllForBooking needs unitsPerBooking scaled by quantity —
  // e.g. quantity 2 of a package needing 2 hotel rooms = 4 rooms claimed.
  const claimRefs = refs.map((r) => ({
    stockModel: r.stockModel,
    stockId: r.stockId,
    unitsPerBooking: r.unitsPerBooking * quantity,
  }));

  // Booking doc needs an _id before we claim (claimed units reference it),
  // so build it in memory first without saving, claim against that _id,
  // then save once claiming succeeds.
  const booking = new PackageBooking({
    userId,
    packageId,
    packageSnapshot: {
      title: pkg.title,
      priceBreakdown: pkg.priceBreakdown,
      itinerary: pkg.itinerary,
      flightDetail: pkg.flightRefs.map((r) => r.stock),
      hotelDetail: pkg.hotelRefs.map((r) => r.stock),
    },
    travellers,
    quantity,
    totalAmount: pkg.sellPrice * quantity,
    status: "initiated",
  });

  let claimed;
  try {
    claimed = await claimAllForBooking(claimRefs, booking._id);
  } catch (err) {
    throw new Error(`Could not reserve stock for this booking: ${err.message}`);
  }

  booking.claimedFlightUnits = claimed
    .filter((c) => c.stockModel === TicketStock)
    .map((c) => ({ stock: c.stock, unitId: c.unitId }));
  booking.claimedHotelUnits = claimed
    .filter((c) => c.stockModel === HotelStock)
    .map((c) => ({ stock: c.stock, unitId: c.unitId }));

  try {
    await booking.save();
  } catch (err) {
    // Booking failed to save after units were claimed — release them all
    // so stock isn't stuck "assigned" to a booking that doesn't exist.
    for (const c of claimed) {
      await releaseUnit(c.stockModel, c.stock, c.unitId);
    }
    throw err;
  }

  return booking;
}

module.exports = { createPackageBooking };