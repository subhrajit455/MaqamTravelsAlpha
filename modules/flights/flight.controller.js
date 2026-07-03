const flightService = require('./flight.service');
const { sendSuccess, sendNotFound } = require('../../utils/apiResponse');


const searchFlights = async (req, res, next) => {
  try {
    const { departure, arrival, departDate, returnDate, passengers, tripType, page, limit } = req.body;
    
    const results = await flightService.searchFlights({
      departure,
      arrival,
      departDate,
      returnDate,
      passengers,
      tripType: tripType || 'oneway', // oneway, roundtrip
      page: page || 1,
      limit: limit || 10,
    });
    
    return sendSuccess(res, {
      message: 'Flights found',
      data: results.flights,
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

const getFlightDetails = async (req, res, next) => {
  try {
    const { flightId } = req.params;
    
    const flight = await flightService.getFlightDetails(flightId);
    if (!flight) {
      return sendNotFound(res, 'Flight not found');
    }
    
    return sendSuccess(res, { message: 'Flight details', data: flight });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  getFlightDetails,
};

//