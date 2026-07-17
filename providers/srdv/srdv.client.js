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

const SRDV_API_KEY = process.env.SRDV_API_KEY;

const SRDV_CREDENTIALS = {
  EndUserIp: process.env.SRDV_END_USER_IP ,
  ClientId: process.env.SRDV_CLIENT_ID || 180174,
  UserName: process.env.SRDV_USERNAME || "MaqamHds",
  Password: process.env.SRDV_PASSWORD || "MaqamHds@9",
};


const flightClient = axios.create({
  baseURL: SRDV_FLIGHT_BASE_URL,
  headers: {
    "Api-Token": SRDV_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 1000 * 25, // 25 seconds
});

/**
 * Hotel endpoints
 */


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
  origin,
  destination,
  departDate,
  returnDate,
  passengers,
  journeyType,
}) => {
  try {
    
    const segment = {
      Origin: origin,
      Destination: destination,
      FlightCabinClass: 0,
      PreferredDepartureTime: normalizeDateTime(departDate),
      PreferredArrivalTime: normalizeDateTime(departDate),
    };
    
    const segments = [segment];
    const journeyTypeCode = mapJourneyType(journeyType);
    
    if (journeyTypeCode === 2 && returnDate) {
      segments.push({
        Origin: destination,
        Destination: origin,
        FlightCabinClass: 1,//hardcoded for now 
        PreferredDepartureTime: normalizeDateTime(returnDate),
        PreferredArrivalTime: normalizeDateTime(returnDate),
      });
    }
    
    logger.info(`SRDV: Searching flights from ${origin} to ${destination}, journeyType: ${journeyType} in client`);
    const payload = {
      ...SRDV_CREDENTIALS,
      ...mapPassengerCounts(passengers),
      JourneyType: journeyTypeCode,
      Segments: segments,
    };

    const response = await flightClient.post("/search", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight search failed: ${error.message}`);
    throw new AppError("SRDV API error", 500);
  }
};

const fareQuote = async ({ srdvType, traceId, srdvIndex, resultIndex }) => {
  try {
    const payload = {
      ...SRDV_CREDENTIALS,
      SrdvType: srdvType,
      TraceId: traceId,
      SrdvIndex: srdvIndex,
      ResultIndex: resultIndex,
    };
    const response = await flightClient.post("/FareQuote", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV fare quote failed: ${error.message}`);
    throw error;
  }
};

/**Booking endpoints (for SRDV)***/


const paxTypeMap = { Adult: 1, Child: 2, Infant: 3 };
const genderMap = { Male: "1", Female: "2" };
const formatDate = (date) =>
  date ? new Date(date).toISOString().replace(/\.\d{3}Z$/, "") : "";

const buildPassenger = (
  traveller,
  isLeadPax,
  fareData, // same fareData is being passed for every passenger, needs to be changed later
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
// Mirrors holdGDS's shape exactly (see srdv-flights-api-reference.md), just isLCC: true
// and ancillaries wired through. This resolves the doc's own open TODO:
// "ticketLCC hasn't been pasted/reviewed yet — check for the same two bug patterns
// (payload-wrapping, empty/incomplete destructure)."
const ticketLCC = async ({
  srdvType, traceId, srdvIndex, resultIndex, travellers, fareData, gstData, ancillaries,
}) => {
  try {
    const payload = {
      ...SRDV_CREDENTIALS,
      SrdvType: srdvType,
      SrdvIndex: srdvIndex,
      TraceId: traceId,
      ResultIndex: resultIndex,
      // Flat top-level object, no { payload } wrapper — same fix as holdGDS.
      // isLCC: true → buildPassenger's isLCC branch adds CellCountryCode,
      // PassportIssueDate, Baggage[]/MealDynamic[]/Seat[].
      Passengers: travellers.map((t) =>
        buildPassenger(t.traveller, t.isLeadPax, fareData, true, gstData, ancillaries)
      ),
    };
    const response = await flightClient.post("/TicketLCC", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight booking failed: ${error.message}`);
    throw error;
  }
};

// const ticketLCC = async ({
//   srdvType,
//   traceId,
//   srdvIndex,
//   resultIndex,
//   travellers,
//   fareData,
//   gstData,
// }) => {
//   const payload = {
//     ...SRDV_CREDENTIALS,
//     SrdvType: srdvType,
//     TraceId: traceId,
//     SrdvIndex: srdvIndex,
//     ResultIndex: resultIndex,
//     Passengers: travellers.map((t) =>
//       buildPassenger(
//         t.traveller,
//         t.isLeadPax,
//         fareData,
//         true,
//         gstData,
//         t.ancillaries,
//       ),
//     ),
//   };

//   try {
//     const response = await flightClient.post("/TicketLCC", payload);
//     return response.data;
//   } catch (error) {
//     logger.error(`SRDV TicketLCC failed: ${error.message}`);
//     throw error;
//   }
// };

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
        buildPassenger(t.traveller, t.isLeadPax, fareData, false, gstData),
      ),
    };

    const response = await flightClient.post("/hold", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight booking failed: ${error.message}`);
    throw error;
  }
};

const ticketGDS = async ({
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
    PNR: pnr,
    BookingId: bookingId,
  };

  try {
    const response = await flightClient.post("/TicketGDS", payload);
    return response.data;
  } catch (error) {
    logger.error(`SRDV flight booking failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  ticketLCC,
  searchFlights,
  fareQuote,
  holdGDS,
  ticketGDS,
};
