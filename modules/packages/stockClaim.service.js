// modules/packages/stockClaim.service.js
//
// Atomic unit claiming for TicketStock + HotelStock. No Mongo transactions — a single
// findOneAndUpdate on one document is already atomic, so units are claimed one at a time.
// The upstream availability check (in packageBooking.service.js) should normally prevent
// a partial failure entirely; this exists to handle the rare race-condition case where it
// still happens, without leaving a half-claimed booking behind.

const TicketStock = require("./ticketStock.model");
const HotelStock = require("./hotelStock.model");

const claimOneUnit = async (StockModel, stockId, bookingId, bookingModel) => {
  const result = await StockModel.findOneAndUpdate(
    { _id: stockId, "units.status": "available" },
    {
      $set: {
        "units.$.status": "assigned",
        "units.$.assignedToBooking": bookingId,
        "units.$.assignedToBookingModel": bookingModel,
        "units.$.assignedAt": new Date(),
      },
    },
    { new: true }
  );
  if (!result) return null; // sold out, or lost a race
  const claimed = result.units.find((u) => String(u.assignedToBooking) === String(bookingId));
  return claimed._id;
};

const releaseOneUnit = async (StockModel, stockId, unitId) => {
  await StockModel.updateOne(
    { _id: stockId, "units._id": unitId },
    {
      $set: {
        "units.$.status": "available",
        "units.$.assignedToBooking": null,
        "units.$.assignedToBookingModel": null,
        "units.$.assignedAt": null,
      },
    }
  );
};

const claimUnitsFromStock = async (StockModel, stockId, count, bookingId, bookingModel) => {
  const claimedUnitIds = [];
  for (let i = 0; i < count; i++) {
    const unitId = await claimOneUnit(StockModel, stockId, bookingId, bookingModel);
    if (!unitId) {
      for (const id of claimedUnitIds) await releaseOneUnit(StockModel, stockId, id);
      throw new Error(`Insufficient available units on stock ${stockId}`);
    }
    claimedUnitIds.push(unitId);
  }
  return claimedUnitIds;
};

// Claims across every ref for one booking. If any ref runs out partway, everything
// claimed on earlier refs in this same call is rolled back too.
const claimUnitsForRefs = async ({ flightRefs, hotelRefs, quantity, bookingId, bookingModel }) => {
  const claimedFlightUnits = [];
  const claimedHotelUnits = [];

  try {
    for (const ref of flightRefs) {
      const count = ref.unitsPerBooking * quantity;
      const unitIds = await claimUnitsFromStock(TicketStock, ref.stock, count, bookingId, bookingModel);
      unitIds.forEach((unitId) => claimedFlightUnits.push({ stock: ref.stock, unitId }));
    }
    for (const ref of hotelRefs) {
      const count = ref.unitsPerBooking * quantity;
      const unitIds = await claimUnitsFromStock(HotelStock, ref.stock, count, bookingId, bookingModel);
      unitIds.forEach((unitId) => claimedHotelUnits.push({ stock: ref.stock, unitId }));
    }
    return { claimedFlightUnits, claimedHotelUnits };
  } catch (error) {
    for (const c of claimedFlightUnits) await releaseOneUnit(TicketStock, c.stock, c.unitId);
    for (const c of claimedHotelUnits) await releaseOneUnit(HotelStock, c.stock, c.unitId);
    throw error;
  }
};

// Payment confirmed → assigned becomes used. Auto, per your call above.
const markUnitsUsed = async (claimedFlightUnits, claimedHotelUnits) => {
  for (const c of claimedFlightUnits) {
    await TicketStock.updateOne({ _id: c.stock, "units._id": c.unitId }, { $set: { "units.$.status": "used" } });
  }
  for (const c of claimedHotelUnits) {
    await HotelStock.updateOne({ _id: c.stock, "units._id": c.unitId }, { $set: { "units.$.status": "used" } });
  }
};

module.exports = { claimUnitsForRefs, markUnitsUsed };