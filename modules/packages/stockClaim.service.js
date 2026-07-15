/**
 * stockClaim.service.js
 *
 * Shared, model-agnostic atomic claim/release logic for stock units.
 * Used by BOTH packageBooking.service.js and offerBooking.service.js —
 * write once here, both booking flows call into it.
 *
 * Works on TicketStock and HotelStock identically: both share the same
 * units[].status shape (available / assigned / used), so the same
 * findOneAndUpdate query works on either model.
 */

/**
 * Atomically claim ONE available unit on a single stock document.
 *
 * Why findOneAndUpdate and not "find doc, then update in JS":
 * doing it in two steps (read the doc, check units in app code, then save)
 * leaves a gap where two requests can both see the same "available" unit
 * before either has saved — that's the race condition. findOneAndUpdate
 * does the check ("is there still an available unit?") and the write
 * ("flip it to assigned") as ONE database operation, so Mongo itself
 * guarantees only one request can win per unit.
 *
 * @param {mongoose.Model} StockModel - TicketStock or HotelStock
 * @param {ObjectId|string} stockId
 * @param {ObjectId|string} bookingId - PackageBooking or OfferBooking _id
 * @returns {Promise<{ stock: ObjectId, unitId: ObjectId }>}
 * @throws {Error} if no available unit exists (sold out)
 */
async function claimUnit(StockModel, stockId, bookingId) {
  // Using the query-level positional operator ($, not arrayFilters) is what
  // makes this claim exactly ONE unit: "units.status": "available" in the
  // query matches the document only if at least one unit qualifies, and
  // "units.$..." in the update touches only the FIRST array element that
  // satisfied that query condition — never all of them. This is the detail
  // that makes the operation both atomic AND single-unit.
  const updated = await StockModel.findOneAndUpdate(
    {
      _id: stockId,
      "units.status": "available",
    },
    {
      $set: {
        "units.$.status": "assigned",
        "units.$.assignedToBooking": bookingId,
        "units.$.assignedAt": new Date(),
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new Error(
      `No available unit found on ${StockModel.modelName} ${stockId} — sold out.`
    );
  }

  const claimedUnit = updated.units.find(
    (u) => String(u.assignedToBooking) === String(bookingId) && u.status === "assigned"
  );

  return { stock: updated._id, unitId: claimedUnit._id };
}

/**
 * Release a previously claimed unit back to "available".
 * Used for rollback when a multi-stock booking fails partway through.
 */
async function releaseUnit(StockModel, stockId, unitId) {
  await StockModel.findOneAndUpdate(
    { _id: stockId, "units._id": unitId },
    {
      $set: {
        "units.$.status": "available",
        "units.$.assignedToBooking": null,
        "units.$.assignedAt": null,
      },
    }
  );
}

/**
 * Claim all units needed for one booking, across one or more stock refs.
 *
 * @param {Array<{ stockModel: mongoose.Model, stockId: ObjectId|string, unitsPerBooking: number }>} refs
 * @param {ObjectId|string} bookingId
 * @returns {Promise<Array<{ stockModel: mongoose.Model, stock: ObjectId, unitId: ObjectId }>>}
 *   list of everything claimed — save this onto claimedFlightUnits/claimedHotelUnits
 * @throws {Error} if any ref runs out of units — everything claimed so far is
 *   automatically released before the error is thrown, so the caller never
 *   has to deal with a half-claimed booking.
 */
async function claimAllForBooking(refs, bookingId) {
  const claimed = [];

  try {
    for (const ref of refs) {
      for (let i = 0; i < ref.unitsPerBooking; i++) {
        const result = await claimUnit(ref.stockModel, ref.stockId, bookingId);
        claimed.push({ stockModel: ref.stockModel, ...result });
      }
    }
    return claimed;
  } catch (err) {
    // Rollback everything claimed so far in this attempt.
    for (const c of claimed) {
      await releaseUnit(c.stockModel, c.stock, c.unitId);
    }
    throw err;
  }
}

module.exports = { claimUnit, releaseUnit, claimAllForBooking };