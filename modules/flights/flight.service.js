const srdvAdapter = require('../../providers/srdv/srdv.adapter');
const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

/**
 * ─── FLIGHT SERVICE ───────────────────────────────────
 * Business logic: calls SRDV adapter for flight searches
 * Model is only for storing bookings, not inventory
 */

const searchFlights = async ({ departure, arrival, departDate, returnDate, passengers, tripType, page = 1, limit = 10 }) => {
  try {
    logger.info(`Searching flights from ${departure} to ${arrival} on ${departDate}`);
    
    // Call SRDV API through adapter
    const results = await srdvAdapter.searchFlights({
      departure,
      arrival,
      departDate,
      returnDate,
      passengers,
      tripType,
      page,
      limit,
    });
    
    if (!results) {
      throw new AppError('Failed to search flights', 500);
    }
    
    return results;
  } catch (error) {
    logger.error(`Flight search failed: ${error.message}`);
    throw error;
  }
};

const getFlightDetails = async (flightId) => {
  try {
    logger.info(`Fetching flight details for ${flightId}`);
    
    // Call SRDV API through adapter
    const flight = await srdvAdapter.getFlightDetails(flightId);
    
    if (!flight) {
      throw new AppError('Flight not found', 404);
    }
    
    return flight;
  } catch (error) {
    logger.error(`Get flight details failed: ${error.message}`);
    throw error;
  }
};

// TODO: saveFlightBooking, getMyBookings (queries FlightBooking model, not SRDV)

module.exports = {
  searchFlights,
  getFlightDetails,
};
