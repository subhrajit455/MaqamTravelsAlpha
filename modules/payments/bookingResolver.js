const mongoose = require('mongoose');
const { BOOKING_MODEL_MAP } = require('./payment.constants');
const { AppError } = require('../../middleware/errorHandler');

// Ensure all target booking models are loaded/registered
try {
  require('../flights/flight.model');
} catch (e) { }
try {
  require('../hotels/hotel.model');
} catch (e) { }
try {
  require('../tours/tour.model');
} catch (e) { }
try {
  require('../packages/package.model');
} catch (e) { }
try {
  require('../bookings/booking.model');
} catch (e) { }

const getModelName = (bookingType) => {
  const modelName = BOOKING_MODEL_MAP[bookingType];
  if (!modelName) {
    throw new AppError(`Unsupported booking type: ${bookingType}`, 400);
  }
  return modelName;
};

const resolveBooking = async (bookingId, bookingType) => {
  const modelName = getModelName(bookingType);
  const Model = mongoose.model(modelName);

  let query = Model.findById(bookingId);

  // Handle different user reference fields across schemas
  if (modelName === 'FlightBooking') {
    query = query.populate('user', '_id email phone name');
  } else if (modelName === 'HotelBooking' || modelName === 'Tour' || modelName === 'Booking') {
    query = query.populate('userId', '_id email phone name');
  }

  const booking = await query;
  if (!booking) {
    throw new AppError(`${modelName} booking not found`, 404);
  }

  // Normalize user reference property
  if (!booking.user && booking.userId) {
    booking.user = booking.userId;
  }

  return booking;
};

module.exports = {
  getModelName,
  resolveBooking,
};
