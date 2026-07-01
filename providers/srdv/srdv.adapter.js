const srdvClient = require('./srdv.client');
const logger = require('../../utils/logger');


const searchHotels = async ({ destination, checkIn, checkOut, guests, page, limit }) => {
  try {
    const rawResults = await srdvClient.searchHotels({
      destination,
      checkIn,
      checkOut,
      guests,
    });
    
    // TODO: Normalize SRDV response to our shape
    // Example normalization:
    // const hotels = rawResults.data.map(hotel => ({
    //   id: hotel.srdv_id,
    //   name: hotel.name,
    //   rating: hotel.rating,
    //   price: hotel.price_per_night,
    //   ...
    // }));
    
    return {
      hotels: rawResults.data || [],
      total: rawResults.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error(`SRDV adapter search hotels failed: ${error.message}`);
    throw error;
  }
};


const getHotelDetails = async (hotelId) => {
  try {
    const rawHotel = await srdvClient.getHotelDetails(hotelId);
    
    // TODO: Normalize to our schema
    // const hotel = {
    //   id: rawHotel.srdv_id,
    //   name: rawHotel.name,
    //   ...
    // };
    
    return rawHotel;
  } catch (error) {
    logger.error(`SRDV adapter get hotel failed: ${error.message}`);
    throw error;
  }
};


const searchFlights = async ({ departure, arrival, departDate, returnDate, passengers, tripType, page, limit }) => {
  try {
    const rawResults = await srdvClient.searchFlights({
      departure,
      arrival,
      departDate,
      returnDate,
      passengers,
      tripType,
    });
    
   
    
    return {
      flights: rawResults.data || [],
      total: rawResults.total || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  } catch (error) {
    logger.error(`SRDV adapter search flights failed: ${error.message}`);
    throw error;
  }
};


const getFlightDetails = async (flightId) => {
  try {
    const rawFlight = await srdvClient.getFlightDetails(flightId);
    
    
    
    return rawFlight;
  } catch (error) {
    logger.error(`SRDV adapter get flight failed: ${error.message}`);
    throw error;
  }
};

const ticketLLCCAdapter = async ()

module.exports = {
  searchHotels,
  getHotelDetails,
  searchFlights,
  getFlightDetails,
};
