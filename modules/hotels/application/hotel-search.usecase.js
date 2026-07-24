'use strict';

/**
 * modules/hotels/application/hotel-search.usecase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean Architecture Search Use-cases for Hotels.
 * Coordinates Discovery, Room Rates, and BlockRoom Recheck.
 */

const crypto = require('crypto');
const cache = require('../../../utils/cache');
const { AppError } = require('../../../middleware/errorHandler');
const { getHotelProvider } = require('../hotel-provider.factory');
const { calculateSellingPrice } = require('./pricing.service');
const { SEARCH_CACHE_TTL_MS, RECHECK_CACHE_TTL_MS } = require('../hotel.constants');

/**
 * Executes hotel search, caches raw context server-side, and returns public cards with selling prices
 */
const searchHotels = async (criteria) => {
  const provider = getHotelProvider();

  // 1. Call SRDV Search
  const result = await provider.searchHotels(criteria);

  // 2. Generate opaque search ID
  const searchId = crypto.randomUUID();

  // 3. Cache server-side context (including raw SRDV indices)
  const sessionData = {
    criteria,
    traceId: result.traceId,
    srdvType: result.srdvType,

    hotels: result._raw.map((h) => ({
      HotelCode: String(h.HotelCode || h.hotelCode || ''),
      ResultIndex: h.ResultIndex || h.resultIndex,
      SrdvIndex: h.SrdvIndex || h.srdvIndex || 1,
      HotelName: h.HotelName || h.hotelName || '',
      Rating: Number(h.StarRating || h.Rating || h.HotelRating || h.hotelRating || h.rating || 0),
      Address: h.Address || h.HotelAddress || h.address || '',
      hotelCode: String(h.HotelCode || h.hotelCode || ''),
      resultIndex: h.ResultIndex || h.resultIndex,
      srdvIndex: h.SrdvIndex || h.srdvIndex || 1,
      hotelName: h.HotelName || h.hotelName || '',
      id: String(h.HotelCode || h.hotelCode || ''),
      raw: h,
    }))
  };

  await cache.set(
    `hotel:search:${searchId}`,
    sessionData,
    SEARCH_CACHE_TTL_MS
  );

  // 4. Map to public DTO with selling prices
  // h.fromPrice.amountMinor = per-night supplier price in minor units (from mapper fix)
  // Markup is applied per-night, then multiplied by nights to get total stay price.
  const nights = (() => {
    const start = new Date(criteria.checkIn);
    const end = new Date(criteria.checkOut);
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  })();

  const publicHotels = result.hotels.map((h) => {
    // Supplier per-night price in minor units
    const supplierPerNightMinor = h.fromPrice.amountMinor;

    // Apply markup on per-night supplier price
    const pricingPerNight = calculateSellingPrice(supplierPerNightMinor, h.fromPrice.currency);

    // Final customer total for the entire stay
    const customerTotalMinor = pricingPerNight.customerTotalMinor * nights;

    // Convert to major units (rupees) for direct display — amountMinor / 100
    const perNightPrice = parseFloat((pricingPerNight.customerTotalMinor / 100).toFixed(2));
    const totalPrice    = parseFloat((customerTotalMinor / 100).toFixed(2));

    return {
      ...h,
      fromPrice: {
        // ── Display fields (major units = rupees) ─────────────────────────────
        perNightPrice,        // e.g. 4520.09   → show as "₹4,520/night" on hotel card
        totalPrice,           // e.g. 9040.18   → show as "₹9,040 total" at checkout
        nights,               // e.g. 2
        currency: pricingPerNight.currency,

        // ── Payment field (minor units = paise) ──────────────────────────────
        // Use this when charging via payment gateway (Razorpay, Stripe, etc.)
        amountMinor: customerTotalMinor, // e.g. 904018 paise = ₹9040.18

        // ── Admin-only pricing breakdown ──────────────────────────────────────
        supplierAmountMinor: pricingPerNight.supplierAmountMinor * nights,
        markupMinor: pricingPerNight.markupMinor * nights,
        feeMinor: pricingPerNight.feeMinor * nights,
        customerTotalMinor,
        pricingVersion: pricingPerNight.pricingVersion,
      },
    };
  });


  return {
    searchId,
    expiresInSeconds: SEARCH_CACHE_TTL_MS / 1000,
    nights,
    hotels: publicHotels,
  };

};



/**
 * Fetches rooms and rates for a selected hotel using cached search context
 */
const getHotelDetails = async ({ searchId, hotelId, correlationId }) => {
  const session = await cache.get(`hotel:search:${searchId}`);
  if (!session) {
    throw new AppError('Search session has expired. Please perform a new search.', 410);
  }

  // Find the cached hotel raw result to get SrdvIndex / ResultIndex
  const normalizedHotelId = String(hotelId || '').replace(/^:/, '');
  if (normalizedHotelId !== hotelId) {
    console.log('Normalizing requested hotelId from', hotelId, 'to', normalizedHotelId);
  }

  console.log('Requested hotelId:', normalizedHotelId);
  console.log(
    'Available hotel codes:',
    session.hotels.map(h => h.hotelCode)
  );

  const cachedHotel = session.hotels.find(
    (h) =>
      String(h.HotelCode || h.hotelCode || h.id) === normalizedHotelId ||
      String(h.id) === normalizedHotelId
  );

  if (!cachedHotel) {
    throw new AppError(
      `Hotel ${hotelId} does not belong to search ${searchId}.`,
      400
    );
  }

  const provider = getHotelProvider();

  // Call Details / Room Rates
  const details = await provider.getHotelRooms({
    cachedHotel,
    searchSession: session,
    correlationId,
  });

  // Derive nights from the cached search criteria
  const nights = Math.max(1, Math.round(
    (new Date(session.criteria.checkOut) - new Date(session.criteria.checkIn)) / (1000 * 60 * 60 * 24)
  ));

  // Calculate selling price for each selectable room option
  const publicRooms = details.rooms.map((room) => {
    // room.price is the per-night supplier price in major units (e.g. 4184.34 INR)
    const supplierPerNightMinor = Math.round(room.price * 100);
    const pricing = calculateSellingPrice(supplierPerNightMinor, room.currency);

    // Per-night selling price (with markup + fee) in major units
    const perNightSellingPrice = parseFloat((pricing.customerTotalMinor / 100).toFixed(2));
    // Total selling price for the full stay
    const totalStaySellingPrice = parseFloat((perNightSellingPrice * nights).toFixed(2));

    return {
      ...room,
      price: perNightSellingPrice,              // per-night selling price in major units
      totalPrice: totalStaySellingPrice,         // total stay selling price in major units
      nights,                                    // number of nights (for frontend display)
      priceSnapshot: {
        supplierAmountMinor: pricing.supplierAmountMinor,
        markupMinor: pricing.markupMinor,
        feeMinor: pricing.feeMinor,
        customerTotalMinor: pricing.customerTotalMinor,
        currency: pricing.currency,
        pricingVersion: pricing.pricingVersion,
      },
    };
  });

  // Cache room details for recheck lookup using the public room ID and raw SRDV payload
  const detailsCacheKey = `hotel:details:${searchId}:${hotelId}`;
  await cache.set(
    detailsCacheKey,
    {
      rooms: details.rooms.map((room) => ({ id: room.id, raw: room.srdvRoomDetails })),
    },
    SEARCH_CACHE_TTL_MS,
  );

  return {
    id: details.id,
    name: details.name,
    rating: details.rating,
    address: details.address,
    description: details.description,
    imageUrls: details.imageUrls,
    currency: details.currency,
    rooms: publicRooms,
  };
};

/**
 * Revalidates price and cancellation policies (BlockRoom).
 * Total price is calculated from the original search dates (checkIn → checkOut).
 */
const recheck = async ({ searchId, hotelId, selectedRooms, correlationId }) => {
  const session = await cache.get(`hotel:search:${searchId}`);
  if (!session) {
    throw new AppError('Search session has expired. Please search again.', 410);
  }

  // Find cached hotel
  const cachedHotel = session.hotels.find(
    (h) =>
      String(h.HotelCode || h.hotelCode || h.id) === String(hotelId) ||
      String(h.id) === String(hotelId)
  );
  if (!cachedHotel) {
    throw new AppError('Hotel is not part of this search.', 400);
  }

  // Find cached room details (from details cache)
  const detailsCacheKey = `hotel:details:${searchId}:${hotelId}`;
  const detailsCache = await cache.get(detailsCacheKey);
  if (!detailsCache) {
    throw new AppError('Room options expired. Please view hotel details again.', 410);
  }

  // Map selectedRooms to raw SRDV room details using the cached public room ID
  const cachedRoomDetails = selectedRooms.map((sel) => {
    const cachedRoom = detailsCache.rooms.find((r) => String(r.id) === String(sel.roomId));
    if (!cachedRoom) throw new AppError(`Room ID ${sel.roomId} is not valid for this hotel.`, 400);
    return {
      srdvRoomDetails: cachedRoom.raw,
      quantity: sel.quantity || 1,
    };
  });

  // ── Nights from original search dates (checkIn → checkOut) ─────────────────
  const nights = Math.max(1, Math.round(
    (new Date(session.criteria.checkOut) - new Date(session.criteria.checkIn)) / (1000 * 60 * 60 * 24)
  ));

  // Call SRDV BlockRoom
  const providerResult = await provider.blockRoom({
    cachedRoomDetails,
    cachedHotel,
    searchSession: session,
    correlationId,
  });

  // BlockRoom gives us the confirmed per-night price from supplier.
  // We apply markup per-night, then multiply by user-selected nights.
  const supplierPerNightMajor = providerResult.price.total;  // total from BlockRoom (1 night)
  const supplierPerNightMinor = Math.round(supplierPerNightMajor * 100);
  const pricingPerNight = calculateSellingPrice(supplierPerNightMinor, providerResult.price.currency);

  const perNightSellingPrice = parseFloat((pricingPerNight.customerTotalMinor / 100).toFixed(2));
  const totalSellingPrice    = parseFloat((perNightSellingPrice * nights).toFixed(2));

  const sellingQuote = {
    perNightPrice: perNightSellingPrice,
    totalPrice: totalSellingPrice,
    nights,
    currency: pricingPerNight.currency,
    // admin fields
    supplierAmountMinor: pricingPerNight.supplierAmountMinor * nights,
    markupMinor: pricingPerNight.markupMinor * nights,
    feeMinor: pricingPerNight.feeMinor * nights,
    customerTotalMinor: pricingPerNight.customerTotalMinor * nights,
    pricingVersion: pricingPerNight.pricingVersion,
  };

  // Cache recheck result
  const recheckId = crypto.randomUUID();
  const recheckSession = {
    searchId,
    hotelId,
    searchSession: session,
    providerResult,
    sellingQuote,
    nights,
  };
  await cache.set(`hotel:recheck:${recheckId}`, recheckSession, RECHECK_CACHE_TTL_MS);

  return {
    recheckId,
    expiresInSeconds: RECHECK_CACHE_TTL_MS / 1000,
    priceChanged: providerResult.priceChanged,
    policyChanged: providerResult.policyChanged,
    hotel: providerResult.hotel,
    // Price summary — in rupees, ready for display
    price: {
      perNightPrice: perNightSellingPrice,  // e.g. 4520.09  → "₹4,520/night"
      totalPrice: totalSellingPrice,        // e.g. 9040.18  → "₹9,040 for 2 nights"
      nights,                               // nights selected by user
      currency: pricingPerNight.currency,
    },
    roomSnapshots: providerResult.roomSnapshots.map((r) => ({
      ...r,
      price: perNightSellingPrice,          // per-night selling price in ₹
      totalPrice: totalSellingPrice,        // total for all nights in ₹
      nights,
    })),
    cancellationPolicy: providerResult.cancellationPolicy,
  };
};

module.exports = { searchHotels, getHotelDetails, recheck };
