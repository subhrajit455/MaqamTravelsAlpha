const {
  searchFlightsService,
  getFareQuoteService,
  getCachedSearchEntryService,
  book,
} = require("./flight.service");
const { sendSuccess, sendNotFound } = require("../../utils/apiResponse");

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

const book = async (req, res) => {
  const { traceId, resultIndex, passengers, gstDetails } = req.body;
  const userId = req.user.id;

  const result = await flightService.book({
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
};

module.exports = {
  searchFlights,
  getFareQuote,
  book,
};
