const Booking = require('./booking.model');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const { PAGINATION } = require('../../config/constants');

/**
 * ─── BOOKING SERVICE ───────────────────────────────────
 * Business logic: manage hotel + flight bookings
 * Calls into hotel/flight services for the actual bookings
 */

const getUserBookings = async (userId, { status, page = 1, limit = 10 } = {}) => {
  try {
    const query = { userId };
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Booking.countDocuments(query);
    
    return {
      bookings,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get user bookings failed: ${error.message}`);
    throw error;
  }
};

const getBookingById = async (bookingId, userId) => {
  try {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    return booking;
  } catch (error) {
    logger.error(`Get booking failed: ${error.message}`);
    throw error;
  }
};

const createBooking = async (userId, { bookingType, itemId, details }) => {
  try {
    // TODO: Call appropriate service (hotelService.saveHotelBooking or flightService.saveFlightBooking)
    // This is orchestration — combines results from hotel/flight + creates a master booking record
    
    const booking = await Booking.create({
      userId,
      bookingType,
      itemId,
      details,
      status: 'pending',
    });
    
    logger.info(`Booking created: ${booking._id}`);
    return booking;
  } catch (error) {
    logger.error(`Create booking failed: ${error.message}`);
    throw error;
  }
};

const updateBooking = async (bookingId, userId, updates) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, userId },
      updates,
      { new: true }
    );
    
    if (booking) logger.info(`Booking updated: ${bookingId}`);
    return booking;
  } catch (error) {
    logger.error(`Update booking failed: ${error.message}`);
    throw error;
  }
};

const cancelBooking = async (bookingId, userId) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, userId },
      { status: 'cancelled', cancelledAt: new Date() },
      { new: true }
    );
    
    if (booking) {
      logger.info(`Booking cancelled: ${bookingId}`);
      // TODO: Process refund through payment service
    }
    
    return booking;
  } catch (error) {
    logger.error(`Cancel booking failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getUserBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
};
