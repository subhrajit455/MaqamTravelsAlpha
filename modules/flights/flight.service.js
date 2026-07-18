const srdvAdapter = require("../../providers/srdv/srdv.adapter");
const FlightBooking = require("./flight.model");
const logger = require("../../utils/logger");
const { AppError } = require("../../middleware/errorHandler");
const cache = require("../../utils/chache");

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000; // 15 min
const FAREQUOTE_CACHE_TTL_MS = 30 * 60 * 1000;
const resultIndexKey = (ri) => (Array.isArray(ri) ? ri.join("||") : ri);

// Strip to exactly what §1 says the cache needs — nothing FE-facing leaks in here
const toCacheEntry = (o) => ({
  resultIndex: o.resultIndex,
  srdvIndex: o.srdvIndex,
  isLCC: o.isLCC,
  singleSlotBooking: o.singleSlotBooking,
  fareType: o.fareType,
  returnIdentifierMatched: o.returnIdentifierMatched,
  offeredFare: o.offeredFare,
});

const searchFlightsService = async ({
  origin,
  destination,
  departDate,
  returnDate,
  passengers,
  journeyType,
}) => {
  logger.info(
    `Searching flights from ${origin} to ${destination} on ${departDate}`,
  );
  try {
    const data = await srdvAdapter.searchFlightsAdapter({
      origin,
      destination,
      departDate,
      returnDate,
      passengers,
      journeyType,
    });

    if (!data) {
      throw new AppError("Failed to search flights", 500);
    }

    cache.set(
      `flight:search:${data.traceId}`,
      {
        srdvType: data.srdvType,
        outbound: data.outbound.map(toCacheEntry),
        inbound: data.inbound?.map(toCacheEntry),
      },
      SEARCH_CACHE_TTL_MS,
    );
    console.log(`Flight search cached with traceId: ${data.traceId}`);
    console.log(
      `Chached date: ${JSON.stringify(cache.get(`flight:search:${data.traceId}`))}`,
    );
    console.log(`Flight search cached with traceId: ${data.traceId}`);
    // FE never sees srdvIndex/isLCC/singleSlotBooking — §1: "not sent to the frontend"

    // const settings = await Settings.findOne();
    // const markupPercent = settings?.flightMarkupPercent || 0;
    const markupPercent = 10;

    const withMarkup = (o) => ({
      resultIndex: o.resultIndex,
      totalAmount:
        Math.round(o.offeredFare * (1 + markupPercent / 100) * 100) / 100,
      isRefundable: o.isRefundable,
      segments: o.segments,
    });

    return {
      traceId: data.traceId,
      outbound: data.outbound.map(withMarkup),
      inbound: data.inbound?.map(withMarkup),
    };
  } catch (error) {
    logger.error(`Flight search failed: ${error.message}`);
    throw error;
  }
};

// Used by fareQuote/book to pull srdvIndex etc back out by resultIndex
const getCachedSearchEntryService = (traceId, resultIndex) => {
  console.log(
    `Fetching cached search entry for traceId:\n\n ${traceId}, resultIndex: ${resultIndex}`,
  );
  const cached = cache.get(`flight:search:${traceId}`);
  console.log(`Cached search entry: ${JSON.stringify(cached)}`);
  console.log(`All data in map:\n ${JSON.stringify(cache.getAll())} `);
  if (!cached)
    throw new AppError("Search session expired, please search again", 410);
  const entry =
    cached.outbound.find((o) => o.resultIndex === resultIndex) ??
    cached.inbound?.find((o) => o.resultIndex === resultIndex);
  if (!entry) throw new AppError("Invalid resultIndex for this search", 400);
  return { ...entry, srdvType: cached.srdvType };
};

const getFareQuoteService = async (traceId, resultIndex) => {
  const isTwoLeg = Array.isArray(resultIndex);
  console.log(
    `Fetching fare quote for traceId in service: ${traceId}, resultIndex: ${resultIndex}`,
  );
  const entries = isTwoLeg
    ? resultIndex.map((ri) => getCachedSearchEntryService(traceId, ri))
    : [getCachedSearchEntryService(traceId, resultIndex)];

  const { srdvType } = entries[0];
  let normalizedResults;

  if (!isTwoLeg) {
    // Single index → one FareQuote call
    normalizedResults = [
      await srdvAdapter.fareQuoteAdapter({
        srdvType,
        traceId,
        srdvIndex: entries[0].srdvIndex,
        resultIndex: entries[0].resultIndex,
      }),
    ];
  } else if (entries[0].singleSlotBooking === "Yes") {
    // Combined-index call — one PNR expected (unverified per flow doc, test before relying on it)
    const combinedIndex =
      entries[0].fareType === "SpecialReturn" &&
      entries[0].returnIdentifierMatched
        ? entries[0].returnIdentifierMatched
        : entries.map((e) => e.resultIndex).join(",");

    normalizedResults = [
      await srdvAdapter.fareQuoteAdapter({
        srdvType,
        traceId,
        srdvIndex: entries[0].srdvIndex,
        resultIndex: combinedIndex,
      }),
    ];
  } else {
    // singleSlotBooking === "No" → two independent calls
    normalizedResults = await Promise.all(
      entries.map((e) =>
        srdvAdapter.fareQuoteAdapter({
          srdvType,
          traceId,
          srdvIndex: e.srdvIndex,
          resultIndex: e.resultIndex,
        }),
      ),
    );
  }

  // Price/time changed on ANY leg → stop, nothing booked yet
  const changed = normalizedResults.find(
    (r) => r.isPriceChanged || r.isTimeChanged,
  );
  if (changed) {
    return {
      priceChanged: true,
      isPriceChanged: changed.isPriceChanged,
      isTimeChanged: changed.isTimeChanged,
      newFare: normalizedResults.map((r) => r.fare),
    };
  }

  // Cache fareSnapshot(s) server-side — never sent raw to FE (§3)
  cache.set(
    `flight:farequote:${traceId}:${resultIndexKey(resultIndex)}`,
    {
      entries: entries.map((e, i) => ({
        srdvType: e.srdvType,
        resultIndex: e.resultIndex,
        srdvIndex: e.srdvIndex,
        isLCC: e.isLCC,
        fare: normalizedResults[i]?.fare ?? normalizedResults[0].fare, // combined-index case shares one
      })),
      isGstMandatory: normalizedResults[0].isGstMandatory,
    },
    FAREQUOTE_CACHE_TTL_MS,
  );

  // const settings = await Settings.findOne();
  // const markupPercent = settings?.flightMarkupPercent || 0;

  const markupPercent = 10;
  const withMarkup = (fare) =>
    Math.round((fare.OfferedFare || 0) * (1 + markupPercent / 100) * 100) / 100;

  return {
    priceChanged: false,
    confirmedFare: normalizedResults.map((r) => withMarkup(r.fare)),
    isGstMandatory: normalizedResults[0].isGstMandatory,
    required: normalizedResults[0].required, // flags identical across legs in practice
  };
};

// --- Book --------------------------------------------------------------
// flight-booking-flow.md §4 — branch isLCC, doc pre-call, then post-call update

const bookFlightService = async ({
  userId,
  traceId,
  resultIndex,
  passengers,
  gstDetails,
}) => {
  const isTwoLeg = Array.isArray(resultIndex);
  const fqCache = cache.get(
    `flight:farequote:${traceId}:${resultIndexKey(resultIndex)}`,
  );
  if (!fqCache) throw new AppError("Fare quote expired, please re-quote", 410);

  if (fqCache.isGstMandatory && !gstDetails) {
    throw new AppError("GST details are required for this fare", 400);
  }

  const leadPax = passengers.find((p) => p.isLeadPax);
  if (!leadPax)
    throw new AppError("Exactly one lead passenger is required", 400);

  // TODO(open decision, flow doc): singleSlotBooking "No" two-doc case — not implemented here.
  // Current code assumes single doc / combined-index path only. Revisit before shipping return flights.

  const travellerIds = passengers.map((p) => p.travellerId);
  const travellerDocs = await Traveller.find({ _id: { $in: travellerIds } });

  const travellersForSrdv = passengers.map((p) => ({
    traveller: travellerDocs.find((t) => t._id.equals(p.travellerId)),
    isLeadPax: !!p.isLeadPax,
  }));

  const entry = fqCache.entries[0];
  const isLCC = entry.isLCC;

  const markupPercent = 10;
  const totalAmount =
    Math.round(
      (entry.fare.OfferedFare || 0) * (1 + markupPercent / 100) * 100,
    ) / 100;

  // Crash-safety net — write "initiated" BEFORE calling SRDV
  let flightBooking = await FlightBooking.create({
    user: userId,
    traceId,
    srdvType: entry.srdvType,
    srdvIndex: entry.srdvIndex,
    resultIndex: isTwoLeg ? resultIndex.join(",") : resultIndex,
    isLCC,
    fareSnapshot: entry.fare,
    isGstMandatory: fqCache.isGstMandatory,
    gstDetails: gstDetails || undefined,
    status: "initiated",
    passengers: passengers.map((p) => ({
      travellerId: p.travellerId,
      isLeadPax: !!p.isLeadPax,
    })),
  });

  try {
    let bookResult;
    if (isLCC) {
      bookResult = await srdvAdapter.ticketLCCAdapter({
        srdvType: entry.srdvType,
        traceId,
        srdvIndex: entry.srdvIndex,
        resultIndex: flightBooking.resultIndex,
        travellers: passengers,
        fareData: entry.fare,
        gstData: gstDetails,
        ancillaries: {}, // MVP: empty Baggage/MealDynamic/Seat, per api-reference
      });

      flightBooking.set({
        pnr: bookResult.pnr,
        srdvBookingId: bookResult.srdvBookingId,
        ticketStatus: bookResult.ticketStatus,
        invoiceNo: bookResult.invoiceNo,
        invoiceStatus: bookResult.invoiceStatus,
        eTicketData: bookResult.eTicketData,
        status: "confirmed", // LCC tickets immediately
        remark:
          bookResult.isPriceChanged || bookResult.isTimeChanged
            ? "Price/time changed at ticketing — ticket already issued, flagged for review"
            : undefined,
      });
    } else {
      bookResult = await srdvAdapter.holdGDSAdapter({
        srdvType: entry.srdvType,
        traceId,
        srdvIndex: entry.srdvIndex,
        resultIndex: flightBooking.resultIndex,
        travellers: passengers,
        fareData: entry.fare,
        gstData: gstDetails,
      });

      flightBooking.set({
        pnr: bookResult.pnr,
        srdvBookingId: bookResult.srdvBookingId,
        lastTicketDate: bookResult.lastTicketDate,
        eTicketData: bookResult.eTicketData,
        status: "pending", // stays pending until TicketGDS post-payment
      });
    }

    await flightBooking.save();
  } catch (error) {
    flightBooking.status = "failed";
    flightBooking.remark = error.message;
    await flightBooking.save();
    throw error;
  }

  // const settings = await Settings.findOne();
  // const markupPercent = settings?.flightMarkupPercent || 0;

  flightBooking.totalAmount = totalAmount;
  flightBooking.markupAmount = totalAmount - (entry.fare.OfferedFare || 0);
  await flightBooking.save();

  // const paypalOrder = await paypalService.createOrder({
  //   amount: totalAmount,
  //   receipt: String(flightBooking._id),
  // });
  flightBooking.paymentOrderId = "1234567890";
  await flightBooking.save();

  return {
    bookingId: flightBooking._id,
    paymentOrderId: paypalOrder.id,
    amount: totalAmount,
  };
};

// --- TicketGDS (post-payment, GDS only) ---------------------------------
// flight-booking-flow.md §6 — called by the payment webhook, never by FE directly

const ticketGDSAfterPayment = async (bookingId) => {
  const flightBooking = await FlightBooking.findById(bookingId);
  if (!flightBooking) throw new AppError("Booking not found", 404);
  if (flightBooking.isLCC)
    throw new AppError("TicketGDS not applicable to LCC bookings", 400);

  if (
    flightBooking.lastTicketDate &&
    new Date() > new Date(flightBooking.lastTicketDate)
  ) {
    flightBooking.status = "failed";
    flightBooking.remark =
      "Hold expired before ticketing (lastTicketDate passed)";
    await flightBooking.save();
    throw new AppError("Ticketing deadline has passed for this hold", 410);
  }

  const result = await srdvAdapter.ticketGDSAdapter({
    srdvType: flightBooking.srdvType,
    traceId: flightBooking.traceId,
    srdvIndex: flightBooking.srdvIndex,
    resultIndex: flightBooking.resultIndex,
    pnr: flightBooking.pnr,
    bookingId: flightBooking.srdvBookingId,
  });

  flightBooking.set({
    ticketStatus: result.ticketStatus,
    invoiceNo: result.invoiceNo,
    invoiceStatus: result.invoiceStatus,
    eTicketData: result.eTicketData,
    status: "confirmed",
  });

  result.passengers.forEach((rp) => {
    const match = flightBooking.passengers.find(
      (p) => p.isLeadPax === undefined || true, // TODO: match by name — travellerId doesn't carry name here
    );
    // NOTE: matching by name requires populating Traveller docs first; placeholder below
    // just applies ticket fields to passengers array in order. Fix before relying on
    // multi-pax bookings — see flag below.
  });

  flightBooking.passengers = flightBooking.passengers.map((p, i) => ({
    ...p.toObject(),
    ticketNumber: result.passengers[i]?.ticketNumber || p.ticketNumber,
    ticketId: result.passengers[i]?.ticketId || p.ticketId,
    ticketIssueDate: result.passengers[i]?.ticketIssueDate || p.ticketIssueDate,
    ticketStatus: result.passengers[i]?.ticketStatus || p.ticketStatus,
  }));

  await flightBooking.save();
  return flightBooking;
};

module.exports = {
  searchFlightsService,
  getFareQuoteService,
  getCachedSearchEntryService,
  bookFlightService,
  ticketGDSAfterPayment,
};
