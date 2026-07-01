const axios = require("axios");
const logger = require("../../utils/logger");
const { AppError } = require("../../middleware/errorHandler");

/**
 * ─── SRDV CLIENT ───────────────────────────────────────
 * Raw HTTP calls to SRDV Travel API
 * Docs: www.srdvtechnologies.com/document/flight/v8
 */

const SRDV_FLIGHT_BASE_URL =
  process.env.SRDV_API_BASE_FLIGHT_URL || "https://flight.srdvtest.com/v8/rest";
const SRDV_HOTEL_BASE_URL =
  process.env.SRDV_API_BASE_HOTEL_URL || "https://hotel.srdv.com/v8/rest";
const SRDV_API_KEY = process.env.SRDV_API_KEY;

const SRDV_CREDENTIALS = {
  EndUserIp: process.env.SRDV_END_USER_IP || "1.1.1.1",
  ClientId: process.env.SRDV_CLIENT_ID,
  UserName: process.env.SRDV_USERNAME,
  Password: process.env.SRDV_PASSWORD,
};

const hotelClient = axios.create({
  baseURL: SRDV_HOTEL_BASE_URL,
  headers: {
    "X-API-Key": SRDV_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

const flightClient = axios.create({
  baseURL: SRDV_FLIGHT_BASE_URL,
  headers: {
    "X-API-Key": SRDV_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Hotel endpoints
 */

const searchHotels = async ({ destination, checkIn, checkOut, guests }) => {
  try {
    logger.info(`SRDV: Searching hotels in ${destination}`);

    const response = await hotelClient.get("/hotels/search", {
      params: {
        destination,
        checkIn,
        checkOut,
        guests,
      },
    });

    return response.data;
  } catch (error) {
    logger.error(`SRDV hotel search failed: ${error.message}`);
    throw new AppError("SRDV API error", 500);
  }
};

const getHotelDetails = async (hotelId) => {
  try {
    logger.info(`SRDV: Fetching hotel ${hotelId}`);

    const response = await hotelClient.get(`/hotels/${hotelId}`);
    return response.data;
  } catch (error) {
    logger.error(`SRDV hotel details failed: ${error.message}`);
    throw new AppError("SRDV API error", 500);
  }
};

const getHotelRoomAvailability = async (hotelId, checkIn, checkOut) => {
  try {
    const response = await hotelClient.get(`/hotels/${hotelId}/rooms`, {
      params: { checkIn, checkOut },
    });
    return response.data;
  } catch (error) {
    logger.error(`SRDV room availability failed: ${error.message}`);
    throw error;
  }
};

/************* FLIGHT ENDPOINTS ********************/

const normalizeDateTime = (date) => {
  if (!date) return "";
  return date.includes("T") ? date : `${date}T00:00:00`;
};

const mapPassengerCounts = (passengers) => {
  if (typeof passengers === "number") {
    return {
      AdultCount: passengers,
      ChildCount: 0,
      InfantCount: 0,
    };
  }

  if (passengers && typeof passengers === "object") {
    return {
      AdultCount: Number(passengers.AdultCount ?? passengers.adult ?? 1),
      ChildCount: Number(passengers.ChildCount ?? passengers.child ?? 0),
      InfantCount: Number(passengers.InfantCount ?? passengers.infant ?? 0),
    };
  }

  return {
    AdultCount: 1,
    ChildCount: 0,
    InfantCount: 0,
  };
};

const mapJourneyType = (journeyType) => {
  const type = String(journeyType || "oneway").toLowerCase();
  if (type === "roundtrip") return 2;
  if (type === "multicity") return 3;
  return 1;
};

const searchFlights = async ({
  departure,
  arrival,
  departDate,
  returnDate,
  passengers,
  journeyType,
}) => {
  try {
    logger.info(`SRDV: Searching flights from ${departure} to ${arrival}`);

    const segment = {
      Origin: departure,
      Destination: arrival,
      FlightCabinClass: 0,
      PreferredDepartureTime: normalizeDateTime(departDate),
      PreferredArrivalTime: normalizeDateTime(departDate),
    };

    const segments = [segment];
    const journeyTypeCode = mapJourneyType(journeyType);

    if (journeyTypeCode === 2 && returnDate) {
      segments.push({
        Origin: arrival,
        Destination: departure,
        FlightCabinClass: 0,
        PreferredDepartureTime: normalizeDateTime(returnDate),
        PreferredArrivalTime: normalizeDateTime(returnDate),
      });
    }

    const payload = {
      ...SRDV_CREDENTIALS,
      ...mapPassengerCounts(passengers),
      JourneyType: journeyTypeCode,
      DirectFlight: false,
      Segments: segments,
    };

    const response = await flightClient.post("/search", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight search failed: ${error.message}`);
    throw new AppError("SRDV API error", 500);
  }
};

const getFlightDetails = async (SrdvType, TraceId, SrdvIndex, ResultIndex) => {
  const payloadData = {
    SrdvType,
    TraceId,
    SrdvIndex,
    ResultIndex,
  };
  try {
    const payload = {
      ...SRDV_CREDENTIALS,
      ...payloadData,
    };
    const response = await flightClient.post(`/FareQuote`, payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight details failed: ${error.message}`);
    throw error;
  }
};

/**
 * Booking endpoints (for SRDV)
 */

const createHotelReservation = async (hotelId, roomId, guestData) => {
  try {
    const response = await hotelClient.post("/hotels/reservations", {
      hotelId,
      roomId,
      guest: guestData,
    });
    return response.data;
  } catch (error) {
    logger.error(`SRDV hotel reservation failed: ${error.message}`);
    throw error;
  }
};

const paxTypeMap = { Adult: 1, Child: 2, Infant: 3 };
const genderMap = { Male: "1", Female: "2" };
const formatDate = (date) =>
  date ? new Date(date).toISOString().replace(/\.\d{3}Z$/, "") : "";

const buildPassenger = (
  traveller,
  isLeadPax,
  fareData,// same fareData is being passed for every passenger, needs to be changed later
  isLCC,
  gstData = {},
  ancillaries = {},
) => {
  
  const passenger = {
    Title: traveller.title,
    FirstName: traveller.firstName,
    LastName: traveller.lastName,
    PaxType: paxTypeMap[traveller.passengerType],
    DateOfBirth: formatDate(traveller.dateOfBirth),
    Gender: genderMap[traveller.gender],

    PassportNo: traveller.passportNo || "",
    PassportExpiry: formatDate(traveller.passportExpiry) || "",

    AddressLine1: (traveller.addressLine1 || "").slice(0, 32),
    City: traveller.city,
    CountryCode: traveller.countryCode,
    CountryName: traveller.countryName,
    ContactNo: traveller.phone,
    Email: traveller.email,

    IsLeadPax: isLeadPax ? 1 : 0,

    GSTCompanyAddress: gstData.address || "",
    GSTCompanyContactNumber: gstData.contactNumber || "",
    GSTCompanyName: gstData.companyName || "",
    GSTNumber: gstData.gstNumber || "",
    GSTCompanyEmail: gstData.email || "",

    Fare: fareData,
  };

  // LCC-only fields — NOT FOR GDS
  if (isLCC) {
    passenger.CellCountryCode = traveller.cellCountryCode;
    passenger.PassportIssueDate = formatDate(traveller.passportIssueDate) || "";
    passenger.Baggage = ancillaries.baggage || [];
    passenger.MealDynamic = ancillaries.meals || [];
    passenger.Seat = ancillaries.seats || [];
  }

  return passenger;
};
//****TICKETLLC */

const ticketLCC = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  travellers,
  fareData,
  gstData,
}) => {
  const payload = {
    ...SRDV_CREDENTIALS,
    SrdvType: srdvType,
    TraceId: traceId,
    SrdvIndex: srdvIndex,
    ResultIndex: resultIndex,
    Passengers: travellers.map((t) =>
      buildPassenger(
        t.traveller,
        t.isLeadPax,
        fareData,
        true,
        gstData,
        t.ancillaries,
      ),
    ),
  };

  try {
    const response = await flightClient.post("/TicketLCC", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV TicketLCC failed: ${error.message}`);
    throw error;
  }
};

const holdGDS = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  travellers,
  fareData,
  gstData,
}) => {
  try {
    const payload = {
      ...SRDV_CREDENTIALS,
      SrdvType: srdvType,
      TraceId: traceId,
      SrdvIndex: srdvIndex,
      ResultIndex: resultIndex,
      Passengers: travellers.map((t) => 
        buildPassenger(t.traveller, t.isLeadPax, fareData, false, gstData)
      ),
    };

    const response = await flightClient.post("/hold", payload,
    );
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight booking failed: ${error.message}`);
    throw error;
  }
};

const ticketGDS =async ({srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  travellers,
  fareData,
  gstData,})=> {
  const payload = {
    ...SRDV_CREDENTIALS,
    SrdvType: srdvType,
    TraceId: traceId,
    SrdvIndex: srdvIndex,
    ResultIndex: resultIndex,
    PNR: pnr,
    BookingId: bookingId,
  }

  try {    
  const response = await flightClient.post("/TicketGDS",payload)
  return response.data;
  } catch (error) {
     logger.error(`SRDV flight booking failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  searchHotels,
  getHotelDetails,
  getHotelRoomAvailability,
  searchFlights,
  getFlightDetails,
  createHotelReservation,
  holdGDS,
  ticketGDS
};
