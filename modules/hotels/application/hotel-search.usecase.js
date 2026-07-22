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
      hotelCode: String(h.HotelCode || h.hotelCode || ''),
      resultIndex: h.ResultIndex || h.resultIndex,
      srdvIndex: h.SrdvIndex || h.srdvIndex || 1,
      hotelName: h.HotelName || h.hotelName || '',
      id: String(h.HotelCode || h.hotelCode || ''),
    }))
  };

  await cache.set(
    `hotel:search:${searchId}`,
    sessionData,
    SEARCH_CACHE_TTL_MS
  );

  // 4. Map to public DTO with selling prices
  const publicHotels = result.hotels.map((h) => {
    // h.fromPrice is already in minor units
    const pricing = calculateSellingPrice(h.fromPrice.amountMinor, h.fromPrice.currency);
    return {
      ...h,
      fromPrice: {
        amountMinor: pricing.customerTotalMinor,
        currency: pricing.currency,
      },
    };
  });


  return {
    searchId,
    expiresInSeconds: SEARCH_CACHE_TTL_MS / 1000,
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

  // Calculate selling price for each selectable room option
  const publicRooms = details.rooms.map((room) => {
    // room.price is in major units, convert to minor
    const supplierMinor = Math.round(room.price * 100);
    const pricing = calculateSellingPrice(supplierMinor, room.currency);

    return {
      ...room,
      price: pricing.customerTotalMinor / 100, // public price in major unit
      totalPrice: pricing.customerTotalMinor * (room.nights || 1) / 100,
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
 * Revalidates price and cancellation policies (BlockRoom)
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

  const provider = getHotelProvider();

  // Call SRDV BlockRoom
  const providerResult = await provider.blockRoom({
    cachedRoomDetails,
    cachedHotel,
    searchSession: session,
    correlationId,
  });

  // Calculate pricing quote using minor units
  const supplierTotalMinor = Math.round(providerResult.price.total * 100);
  const pricing = calculateSellingPrice(supplierTotalMinor, providerResult.price.currency);

  const sellingQuote = {
    supplierAmountMinor: pricing.supplierAmountMinor,
    markupMinor: pricing.markupMinor,
    feeMinor: pricing.feeMinor,
    customerTotalMinor: pricing.customerTotalMinor,
    currency: pricing.currency,
    pricingVersion: pricing.pricingVersion,
  };

  // Cache recheck result
  const recheckId = crypto.randomUUID();
  const recheckSession = {
    searchId,
    hotelId,
    searchSession: session,
    providerResult, // contains mapped roomSnapshots + _raw details
    sellingQuote,
  };
  await cache.set(`hotel:recheck:${recheckId}`, recheckSession, RECHECK_CACHE_TTL_MS);

  return {
    recheckId,
    expiresInSeconds: RECHECK_CACHE_TTL_MS / 1000,
    priceChanged: providerResult.priceChanged,
    policyChanged: providerResult.policyChanged,
    hotel: providerResult.hotel,
    roomSnapshots: providerResult.roomSnapshots.map((r) => {
      // room price mapping for frontend display
      const rPriceMinor = Math.round(r.totalPrice * 100);
      const rPricing = calculateSellingPrice(rPriceMinor, r.currency);
      return {
        ...r,
        price: rPricing.customerTotalMinor / 100 / (r.nights || 1),
        totalPrice: rPricing.customerTotalMinor / 100,
      };
    }),
    price: {
      currency: pricing.currency,
      total: pricing.customerTotalMinor / 100, // public selling price
    },
    cancellationPolicy: providerResult.cancellationPolicy,
  };
};

module.exports = { searchHotels, getHotelDetails, recheck };
