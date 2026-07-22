const srdvClient = require("./srdv.client");
const logger = require("../../utils/logger");
const { AppError } = require("../../middleware/errorHandler");

// const searchHotels = async ({
//   origin,
//   destination,
//   checkIn,
//   checkOut,
//   guests,
//   page,
//   limit,
// }) => {
//   try {
//     const rawResults = await srdvClient.searchHotels({
//       origin,
//       destination,
//       checkIn,
//       checkOut,
//       guests,
//     });

//     return {
//       hotels: rawResults.data || [],
//       total: rawResults.total || 0,
//       page: parseInt(page),
//       limit: parseInt(limit),
//     };
//   } catch (error) {
//     logger.error(`SRDV adapter search hotels failed: ${error.message}`);
//     throw error;
//   }
// };



const coerceFare = (fare = {}) => ({
  baseFare: parseFloat(fare.BaseFare) || 0,
  tax: parseFloat(fare.Tax) || 0,
  yqTax: parseFloat(fare.YQTax) || 0, // can arrive as ""
  transactionFee: parseFloat(fare.TransactionFee) || 0, // can arrive as "0" string
  offeredFare: parseFloat(fare.OfferedFare) || 0,
});

// IsGSTMandatory / GSTAllowed can be true/false OR the string "Not Set"
const coerceTriState = (value) => {
  if (value === "Not Set" || value === undefined || value === null) return null;
  return value === true || value === "true";
};

function normalizeFlightOption(fareData, legs) {
  const fare = coerceFare(fareData.Fare);
  const firstSeg = fareData.FareSegments?.[0] || {};

  return {
    resultIndex: fareData.ResultIndex,
    srdvIndex: fareData.SrdvIndex,
    isLCC: !!fareData.IsLCC,
    singleSlotBooking: fareData.SingleSlotBooking,

    // ⚠️ Not present on the sample FareDataMultiple in the reference doc.
    // flight-booking-flow.md's cache shape needs these for FareQuote branching (§3) —
    // keeping the read here so nothing downstream breaks, but VERIFY actual field
    // names in a real search response before relying on either.
    fareType: fareData.FareType ?? null,
    returnIdentifierMatched:
      fareData.ReturnIdentifier ?? fareData.ReturnIdentifierMatched ?? null,

    isRefundable: !!fareData.IsRefundable,
    isGstMandatory: coerceTriState(fareData.IsGSTMandatory),
    offeredFare: fare.offeredFare || parseFloat(fareData.OfferedFare) || 0,
    baseFare: fare.baseFare,
    tax: fare.tax,

    segments: (legs || []).map((seg) => ({
      airline: seg.Airline?.AirlineName,
      airlineCode: seg.Airline?.AirlineCode,
      flightNo: seg.Airline?.FlightNumber,
      origin: seg.Origin?.CityName,
      originCode: seg.Origin?.AirportCode,
      destination: seg.Destination?.CityName,
      destinationCode: seg.Destination?.AirportCode,
      departure: seg.DepTime,
      arrival: seg.ArrTime,
      duration: seg.Duration,
      baggage: firstSeg.Baggage,
      cabinClass: firstSeg.CabinClassName,
      seatsLeft: firstSeg.NoOfSeatAvailable,
    })),
  };
}

// One "option" = { FareDataMultiple: [...], Segments: [...] }.
// Assumption (unverified — only single-fare example in the doc): FareDataMultiple[i]
// pairs with Segments[i] at the same index. Falls back to Segments[0] if a parallel
// entry doesn't exist, so it won't throw on single-fare options — but confirm this
// pairing against a real multi-fare response before trusting it for SingleSlotBooking
// combos.
function normalizeResultsGroup(group = []) {
  const options = [];
  group.forEach((option) => {
    const fareDataList = option.FareDataMultiple || [];
    const segmentGroups = option.Segments || [];
    fareDataList.forEach((fareData, idx) => {
      const legs = segmentGroups[idx] || segmentGroups[0] || [];
      options.push(normalizeFlightOption(fareData, legs));
    });
  });
  return options;
}

function normalizeSearchResponse(raw) {
  if (raw?.Error?.ErrorCode && raw.Error.ErrorCode !== "0") {
    throw new AppError(raw.Error.ErrorMessage || "SRDV search error", 502);
  }

  const outboundGroup = raw.Results?.[0];
  const inboundGroup = raw.Results?.[1];

  return {
    traceId: String(raw.TraceId),
    srdvType: raw.SrdvType,
    outbound: normalizeResultsGroup(outboundGroup),
    inbound: inboundGroup ? normalizeResultsGroup(inboundGroup) : undefined,
  };
}

const searchFlightsAdapter = async ({
  origin,
  destination,
  departDate,
  returnDate,
  passengers,
  journeyType,
}) => {
  try {
    const rawResults = await srdvClient.searchFlights({
      origin,
      destination,
      departDate,
      returnDate,
      passengers,
      journeyType,
    });

    return normalizeSearchResponse(rawResults);
  } catch (error) {
    logger.error(`SRDV adapter search flights failed: ${error.message}`);
    throw error;
  }
};

// ----------------FARE QUOTE------------------------

function normalizeFareQuoteResponse(raw) {
  if (raw?.Error?.ErrorCode && raw.Error.ErrorCode !== "0") {
    throw new AppError(raw.Error.ErrorMessage || "SRDV fare quote error", 502);
  }

  const results = raw.Results || {};

  // ⚠️ IsTimeChanged: flight-booking-flow.md §3 lists it alongside IsPriceChanged as a
  // top-level field, but no FareQuote sample in srdv-flights-api-reference.md actually
  // shows it anywhere (top-level or under Results). Reading defensively from both
  // spots, defaulting false — CONFIRM against a live response before trusting this for
  // the "stop, don't book" gate.
  const isPriceChanged = !!(raw.IsPriceChanged ?? results.IsPriceChanged);
  const isTimeChanged = !!(raw.IsTimeChanged ?? results.IsTimeChanged);

  return {
    traceId: String(raw.TraceId),
    srdvType: raw.SrdvType,
    isPriceChanged,
    isTimeChanged,

    srdvIndex: results.SrdvIndex,
    resultIndex: results.ResultIndex,
    isLCC: !!results.IsLCC,
    isRefundable: !!results.IsRefundable,
    isGstMandatory: coerceTriState(results.IsGSTMandatory),

    // paxCount:{
      
    // }
    required: {
      passport: !!results.IsPassportRequiredAtBook,
      passportFullDetail: !!results.IsPassportFullDetailRequiredAtBook,
      passportExpiry: !!results.IsPassportExpiryRequired,
      passportIssueDate: !!results.IsPassportIssueDateRequired,
      adultDob: !!results.AdultDobRequired,
      childDob: !!results.ChildDobRequired,
      infantDob: !!results.InfantDobRequired,
      hold: !!results.HoldAllowed,
      seatSelect: !!results.SeatSelectAllowed,
    },

    // Passed through AS-IS, not re-keyed — both docs require this exact object to be
    // echoed verbatim into Book's Passengers[].Fare. Re-shaping it here would break that.
    fare: results.Fare || {},
  };
}

const fareQuoteAdapter = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
}) => {
  try {
    const raw = await srdvClient.fareQuote({
      srdvType,
      traceId,
      srdvIndex,
      resultIndex,
    });
    return normalizeFareQuoteResponse(raw);
  } catch (error) {
    logger.error(`SRDV adapter fare quote failed: ${error.message}`);
    throw error;
  }
};

//----------------TICKET LCC------------------------

function normalizeTicketLCCResponse(raw) {
  
  if (raw?.Error?.ErrorCode && raw.Error.ErrorCode !== "0") {
    throw new AppError(
      raw.Error.ErrorMessage || "SRDV ticket (LCC) error",
      502,
    );
  }

  const response = raw.Response || {};
  const itinerary = response.FlightItinerary || {};

  return {
    traceId: String(raw.TraceId),
    srdvType: raw.SrdvType,
    pnr: response.PNR,
    srdvBookingId: response.BookingId,

    // Price/time changed here does NOT mean stop — LCC has no hold step, the ticket
    // is already real. Per flight-booking-flow.md §4: "log + flag only."
    isPriceChanged: !!response.IsPriceChanged,
    isTimeChanged: !!response.IsTimeChanged,

    ticketStatus: response.TicketStatus,
    invoiceNo: itinerary.InvoiceNo || "",
    invoiceStatus: itinerary.InvoiceStatus || "",

    // Ticket fields legitimately empty here (TicketNumber/IssueDate) — TicketLCC's sync
    // response doesn't carry them. flight_callback fills these in later, matched by name.
    passengers: (itinerary.Passenger || []).map((p) => ({
      title: p.Title,
      firstName: p.FirstName,
      lastName: p.LastName,
      paxType: p.PaxType,
      ticketNumber: p.Ticket?.TicketNumber || "",
      ticketId: p.Ticket?.TicketId || "",
      ticketIssueDate: p.Ticket?.IssueDate || "",
      ticketStatus: p.Ticket?.Status || "",
    })),

    eTicketData: itinerary,
    status: "confirmed",
  };
}

const ticketLCCAdapter = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  travellers,
  fareData,
  gstData,
  ancillaries,
}) => {
  try {
    const raw = await srdvClient.ticketLCC({
      srdvType,
      traceId,
      srdvIndex,
      resultIndex,
      travellers,
      fareData,
      gstData,
      ancillaries,
    });

    console.log(`\n\n\nHi here is your res from SRDV ticketLLC:${JSON.stringify(raw)} `) //logging for tesrt
    
    return normalizeTicketLCCResponse(raw);
  } catch (error) {
    logger.error(`SRDV adapter ticket LCC failed: ${error.message}`);
    throw error;
  }
};

//-----------------TICKET GDS------------------------
function normalizeHoldGdsResponse(raw) {
  if (raw?.Error?.ErrorCode && raw.Error.ErrorCode !== "0") {
    throw new AppError(raw.Error.ErrorMessage || "SRDV hold GDS error", 502);
  }

  const response = raw.Response || {};
  const itinerary = response.FlightItinerary || {};

  return {
    traceId: String(raw.TraceId),
    srdvType: raw.SrdvType,
    pnr: response.PNR,
    srdvBookingId: response.BookingId,
    isPriceChanged: !!response.IsPriceChanged,
    isTimeChanged: !!response.IsTimeChanged,
    ssrDenied: !!response.SSRDenied,

    // ⚠️ CRITICAL per both docs — deadline TicketGDS must beat after payment
    lastTicketDate: itinerary.LastTicketDate || null,

    eTicketData: itinerary,
    status: "pending", // not confirmed — awaiting payment + TicketGDS
  };
}

const holdGDSAdapter = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  travellers,
  fareData,
  gstData,
}) => {
  try {
    const raw = await srdvClient.holdGDS({
      srdvType,
      traceId,
      srdvIndex,
      resultIndex,
      travellers,
      fareData,
      gstData,
    });
    return normalizeHoldGdsResponse(raw);
  } catch (error) {
    logger.error(`SRDV adapter hold GDS failed: ${error.message}`);
    throw error;
  }
};

function normalizeTicketGdsResponse(raw) {
  if (raw?.Error?.ErrorCode && raw.Error.ErrorCode !== "0") {
    throw new AppError(raw.Error.ErrorMessage || "SRDV ticket GDS error", 502);
  }

  const response = raw.Response || {};
  const itinerary = response.FlightItinerary || {};

  return {
    traceId: String(raw.TraceId),
    pnr: response.PNR,
    srdvBookingId: response.BookingId,
    ticketStatus: response.TicketStatus,
    invoiceNo: itinerary.InvoiceNo || "",
    invoiceStatus: itinerary.InvoiceStatus,

    passengers: (itinerary.Passenger || []).map((p) => ({
      title: p.Title,
      firstName: p.FirstName,
      lastName: p.LastName,
      ticketId: p.Ticket?.TicketId,
      ticketNumber: p.Ticket?.TicketNumber || "",
      ticketIssueDate: p.Ticket?.IssueDate || "",
      ticketStatus: p.Ticket?.Status || "",
    })),

    eTicketData: itinerary,
    status: "confirmed",
  };
}

const ticketGDSAdapter = async ({
  srdvType,
  traceId,
  srdvIndex,
  resultIndex,
  pnr,
  bookingId,
}) => {
  try {
    const raw = await srdvClient.ticketGDS({
      srdvType,
      traceId,
      srdvIndex,
      resultIndex,
      pnr,
      bookingId,
    });
    return normalizeTicketGdsResponse(raw);
  } catch (error) {
    logger.error(`SRDV adapter ticket GDS failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  
  searchFlightsAdapter,
  fareQuoteAdapter,
  ticketLCCAdapter,
  holdGDSAdapter,
  ticketGDSAdapter,
};
