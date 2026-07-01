const bookingService = require('./booking.service');
const { sendSuccess, sendCreated, sendNotFound } = require('../../utils/apiResponse');

/**
 * ─── BOOKING CONTROLLER ────────────────────────────────
 * Thin layer: calls service, sends response
 */

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user?.id; // from auth middleware
    const { status, page, limit } = req.query;
    
    const result = await bookingService.getUserBookings(userId, { status, page, limit });
    
    return sendSuccess(res, {
      message: 'Bookings retrieved',
      data: result.bookings,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getBookingDetails = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;
    
    const booking = await bookingService.getBookingById(bookingId, userId);
    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }
    
    return sendSuccess(res, { message: 'Booking details', data: booking });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { bookingType, itemId, details } = req.body;
    
    const booking = await bookingService.createBooking(userId, {
      bookingType,
      itemId,
      details,
    });
    
    return sendCreated(res, booking, 'Booking created successfully');
  } catch (error) {
    next(error);
  }
};

const updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;
    const updates = req.body;
    
    const booking = await bookingService.updateBooking(bookingId, userId, updates);
    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }
    
    return sendSuccess(res, { message: 'Booking updated', data: booking });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;
    
    const booking = await bookingService.cancelBooking(bookingId, userId);
    if (!booking) {
      return sendNotFound(res, 'Booking not found');
    }
    
    return sendSuccess(res, { message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyBookings,
  getBookingDetails,
  createBooking,
  updateBooking,
  cancelBooking,
};
