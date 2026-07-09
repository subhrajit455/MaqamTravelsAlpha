const {
  searchFlightsService,
  getFareQuoteService,
  getCachedSearchEntryService,
  bookFlightService,
} = require("./flight.service");
const { sendSuccess, sendCreated, sendNotFound } = require("../../utils/apiResponse");

const searchFlights = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      journeyType,
    } = req.body;

    const results = await searchFlightsService({
      departure: origin,
      arrival: destination,
      departDate: departureDate,
      returnDate,
      passengers,
      journeyType: journeyType || "oneway", // oneway, roundtrip
    });

    return sendSuccess(res, {
      message: "Flights found",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const getFareQuote = async (req, res, next) => {
  try {
    const { traceId, flightId } = req.params;
    const flight = await getFareQuoteService(traceId, flightId);

    if (!flight) {
      return sendNotFound(res, "Flight not found");
    }

    return sendSuccess(res, { message: "Flight details", data: flight });
  } catch (error) {
    next(error);
  }
};

const book = async (req, res, next) => {
  try {
    const { traceId, resultIndex, passengers, gstDetails } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendNotFound(res, "Authenticated user is required");
    }

    const result = await bookFlightService({
      userId,
      traceId,
      resultIndex,
      passengers,
      gstDetails,
    });

    return sendCreated(res, {
      message: "Booking initiated, proceed to payment",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchFlights,
  getFareQuote,
  book,
};

//