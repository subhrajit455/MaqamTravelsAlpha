// modules/packages/package.validator.js
//
// Manual validation — no external library assumed. Throws AppError(400); express-async-errors
// means controllers don't need their own try/catch for this to reach the error middleware.

const mongoose = require("mongoose");
const { AppError } = require("../../middleware/errorHandler");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateRefArray = (refs, label) => {
  if (refs === undefined) return; // optional — a Package can have zero flight/hotel refs
  if (!Array.isArray(refs)) throw new AppError(`${label} must be an array`, 400);
  refs.forEach((ref, i) => {
    if (!ref.stock || !isValidObjectId(ref.stock)) {
      throw new AppError(`${label}[${i}].stock must be a valid ObjectId`, 400);
    }
    if (!Number.isInteger(ref.unitsPerBooking) || ref.unitsPerBooking < 1) {
      throw new AppError(`${label}[${i}].unitsPerBooking must be an integer >= 1`, 400);
    }
  });
};

const validateOtherItems = (items) => {
  if (items === undefined) return;
  if (!Array.isArray(items)) throw new AppError("otherItems must be an array", 400);
  items.forEach((item, i) => {
    if (!item.label) throw new AppError(`otherItems[${i}].label is required`, 400);
    if (typeof item.cost !== "number" || item.cost < 0) {
      throw new AppError(`otherItems[${i}].cost must be a number >= 0`, 400);
    }
  });
};

const validateCreatePackage = (data) => {
  if (!data.title) throw new AppError("title is required", 400);
  if (!data.destination) throw new AppError("destination is required", 400);
  if (typeof data.sellPrice !== "number" || data.sellPrice < 0) {
    throw new AppError("sellPrice must be a number >= 0", 400);
  }
  validateRefArray(data.flightRefs, "flightRefs");
  validateRefArray(data.hotelRefs, "hotelRefs");
  validateOtherItems(data.otherItems);
};

// Update is partial — only validate fields actually sent.
const validateUpdatePackage = (data) => {
  if (data.sellPrice !== undefined && (typeof data.sellPrice !== "number" || data.sellPrice < 0)) {
    throw new AppError("sellPrice must be a number >= 0", 400);
  }
  if (data.flightRefs !== undefined) validateRefArray(data.flightRefs, "flightRefs");
  if (data.hotelRefs !== undefined) validateRefArray(data.hotelRefs, "hotelRefs");
  if (data.otherItems !== undefined) validateOtherItems(data.otherItems);
};

module.exports = { validateCreatePackage, validateUpdatePackage };