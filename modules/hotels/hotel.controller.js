const hotelService = require('./hotel.service');
const { sendSuccess, sendNotFound, sendError } = require('../../utils/apiResponse');

/**
 * ─── HOTEL CONTROLLER ──────────────────────────────────
 * Thin layer: calls service, sends response
 */

const searchHotels = async (req, res, next) => {
  try {
    const { destination, checkIn, checkOut, guests, page, limit } = req.body;
    
    const results = await hotelService.searchHotels({
      destination,
      checkIn,
      checkOut,
      guests,
      page: page || 1,
      limit: limit || 10,
    });
    
    return sendSuccess(res, {
      message: 'Hotels found',
      data: results.hotels,
      meta: {
        total: results.total,
        page: results.page,
        limit: results.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getHotelDetails = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    
    const hotel = await hotelService.getHotelDetails(hotelId);
    if (!hotel) {
      return sendNotFound(res, 'Hotel not found');
    }
    
    return sendSuccess(res, { message: 'Hotel details', data: hotel });
  } catch (error) {
    next(error);
  }
};

// TODO: getMyBookings with auth middleware

module.exports = {
  searchHotels,
  getHotelDetails,
};
