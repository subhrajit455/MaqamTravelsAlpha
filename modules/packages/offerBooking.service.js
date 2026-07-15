
const Offer = require("../models/offer.model");
const OfferBooking = require("../models/offerBooking.model");
const TicketStock = require("../models/ticketStock.model");
const HotelStock = require("../models/hotelStock.model");

const { claimAllForBooking, releaseUnit } = require("./stockClaim.service");
const { availabilityForOffer } = require("./availability.service");

/**
 * Create an OfferBooking — mirrors createPackageBooking, but there's only
 * ever ONE stock ref (flightRef or hotelRef, per itemType), so no min() /
 * array-building step is needed. Reuses the same claimAllForBooking either
 * way — just called with a one-item ref list.
 */
async function createOfferBooking({ userId, offerId, travellers, quantity }) {
  const offer = await Offer.findById(offerId)
    .populate("flightRef.stock")
    .populate("hotelRef.stock");

  if (!offer || !offer.isActive) {
    throw new Error("Offer not found or not active.");
  }

  const isFlight = offer.itemType === "flight";
  const stockModel = isFlight ? TicketStock : HotelStock;
  const ref = isFlight ? offer.flightRef : offer.hotelRef;
  const stockDoc = ref.stock;

  const availableBookings = availabilityForOffer(stockDoc, ref.unitsPerBooking);
  if (availableBookings < quantity) {
    throw new Error(
      `Only ${availableBookings} booking(s) worth of stock left for this offer.`
    );
  }

  const booking = new OfferBooking({
    userId,
    offerId,
    offerSnapshot: {
      title: offer.title,
      sellPrice: offer.sellPrice,
      itemType: offer.itemType,
      detail: stockDoc,
    },
    travellers,
    quantity,
    totalAmount: offer.sellPrice * quantity,
    status: "initiated",
  });

  let claimed;
  try {
    claimed = await claimAllForBooking(
      [{ stockModel, stockId: stockDoc._id, unitsPerBooking: ref.unitsPerBooking * quantity }],
      booking._id
    );
  } catch (err) {
    throw new Error(`Could not reserve stock for this booking: ${err.message}`);
  }

  if (isFlight) {
    booking.claimedFlightUnits = claimed.map((c) => ({ stock: c.stock, unitId: c.unitId }));
  } else {
    booking.claimedHotelUnits = claimed.map((c) => ({ stock: c.stock, unitId: c.unitId }));
  }

  try {
    await booking.save();
  } catch (err) {
    for (const c of claimed) {
      await releaseUnit(c.stockModel, c.stock, c.unitId);
    }
    throw err;
  }

  return booking;
}

module.exports = { createOfferBooking };