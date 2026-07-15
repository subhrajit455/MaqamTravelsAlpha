// const srdvAdapter = require('../../providers/srdv/srdv.adapter');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

/**
 * ─── HOTEL SERVICE ─────────────────────────────────────
 * Business logic: calls SRDV adapter for hotel searches
 * Model is only for storing bookings, not inventory
 */

const searchHotels = async ({ destination, checkIn, checkOut, guests, page = 1, limit = 10 }) => {
  try {
    logger.info(`Searching hotels in ${destination} from ${checkIn} to ${checkOut}`);
    
    // Call SRDV API through adapter
    const results = await srdvAdapter.searchHotels({
      destination,
      checkIn,
      checkOut,
      guests,
      page,
      limit,
    });
    
    if (!results) {
      throw new AppError('Failed to search hotels', 500);
    }
    
    return results;
  } catch (error) {
    logger.error(`Hotel search failed: ${error.message}`);
    throw error;
  }
};

const getHotelDetails = async (hotelId) => {
  try {
    logger.info(`Fetching hotel details for ${hotelId}`);
    
    // Call SRDV API through adapter
    const hotel = await srdvAdapter.getHotelDetails(hotelId);
    
    if (!hotel) {
      throw new AppError('Hotel not found', 404);
    }
    
    return hotel;
  } catch (error) {
    logger.error(`Get hotel details failed: ${error.message}`);
    throw error;
  }
};

// TODO: saveHotelBooking, getMyBookings (queries HotelBooking model, not SRDV)

module.exports = {
  searchHotels,
  getHotelDetails,
};
