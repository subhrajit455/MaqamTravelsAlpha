// 'use strict';

/**
 * providers/hotels/srdv/srdv-hotel.provider.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SRDV Hotel Provider Adapter.
 * Adapts SRDV Hotel Client/Mapper to the Maqam Hotel Provider Contract.
 */

const client = require('./srdv-hotel.client');
const mapper = require('./srdv-hotel.mapper');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../middleware/errorHandler');

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

// Reusable description parser for SRDV responses (handles strings, arrays, and object nodes)
const stringifyDescription = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(stringifyDescription).filter(Boolean).join(' ');
  }
  if (typeof value === 'object') {
    const preferredText = [value.Name, value.Title, value.Heading, value.Label].filter(Boolean).join(' ');
    const detailText = stringifyDescription(
      value.Detail || value.Details || value.Description || value.HotelDescription || value.Text || value.Content || value.Value,
    );
    const combined = [preferredText, detailText].filter(Boolean).join(': ');
    if (combined) return combined;
    return Object.values(value).map(stringifyDescription).filter(Boolean).join(' ');
  }
  return '';
};

module.exports = {
  /**
   * Search hotels based on destination, dates, rooms and guests
   */
  searchHotels: async (criteria) => {
    try {
      const payload = mapper.mapSearchRequest(criteria);
      const rawResult = await client.search(payload, criteria.correlationId);
      // Temporary debug: log raw SRDV response to help diagnose empty results
      logger.info(`[SRDV Provider] raw search response: ${JSON.stringify(rawResult)}`);
      const normalized = mapper.mapSearchResponse(rawResult, criteria);
      return normalized;
    } catch (error) {
      // If SRDV returns 'Result not found the the selected segment' (ErrorCode 100)
      // bubble this up as a clear client-facing error instead of silently returning an empty list.
      const msg = error && error.message ? error.message : '';
      if (msg.includes('Result not found') || msg.includes('ErrorCode":"100"')) {
        logger.info('[SRDV Provider] Search returned no results for given segment.');
        throw new AppError(
          'No hotels found for these search parameters. Please verify cityId, countryCode, dates, and guest details.',
          404,
        );
      }

      logger.error(`[SRDV Provider] searchHotels failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Gets details for a specific hotel (combines HotelRoom rates and HotelInfo content if available)
   */


  getHotelDetails: async (params) => {
    try {
      const { cachedHotel, searchSession, correlationId } = params;
      const nights = nightsBetween(searchSession.criteria.checkIn, searchSession.criteria.checkOut);


      // Fetch hotel info first, as SRDV requires hotel details before room details.
      let info = { description: '', images: [], address: cachedHotel.HotelAddress || cachedHotel.address || '' };
      const infoPayload = {
        SrdvType: searchSession.srdvType,
        SrdvIndex: cachedHotel.SrdvIndex || cachedHotel.srdvIndex || 1,
        TraceId: searchSession.traceId,
        ResultIndex: cachedHotel.ResultIndex || cachedHotel.resultIndex,
        HotelCode: cachedHotel.HotelCode || cachedHotel.hotelCode || cachedHotel.id,
      };

      const rawInfo = await client.hotelInfo(infoPayload, correlationId);
      const infoResult = rawInfo.GetHotelInfoResult || rawInfo.HotelInfoResult || rawInfo;
      if (infoResult?.Error && infoResult.Error.ErrorCode !== 0) {
        logger.error(`[SRDV Provider] hotelInfo failed: ${JSON.stringify(infoResult.Error)}`);
        throw new AppError(`SRDV Hotel API error: ${infoResult.Error.ErrorMessage || JSON.stringify(infoResult.Error)}`, 502);
      }
      if (infoResult) {
        const rawDescription = infoResult.HotelDetails?.Description || infoResult.HotelDetails?.HotelDescription || infoResult.Description || infoResult.HotelDescription;
        info.description = stringifyDescription(rawDescription) || info.description;

        info.address =
          infoResult.Address ||
          infoResult.HotelDetails?.Address ||
          infoResult.HotelDetails?.AddressLine1 ||
          [infoResult.HotelDetails?.City, infoResult.HotelDetails?.CountryName].filter(Boolean).join(', ') ||
          info.address;

        info.images =
          infoResult.Images ||
          infoResult.HotelDetails?.Images ||
          (infoResult.HotelDetails?.HotelPicture ? ([]).concat(infoResult.HotelDetails.HotelPicture) : []) ||
          info.images;

        // Debug log when key fields are still missing to aid diagnosis in production
        if (!info.description || !info.address || !info.images.length) {
          logger.info(`[SRDV Provider] hotelInfo partial/missing fields for HotelCode=${infoPayload.HotelCode} trace=${infoPayload.TraceId} — descriptionPresent=${!!info.description} addressPresent=${!!info.address} images=${info.images.length}`);
          try {
            logger.debug(`[SRDV Provider] rawInfo snippet: ${JSON.stringify({ HotelDetails: infoResult.HotelDetails || null, Address: infoResult.Address || null, Images: infoResult.Images || null }, null, 2)}`);
          } catch (e) {
            logger.debug('[SRDV Provider] rawInfo snippet unavailable for logging');
          }
        }
      }

      // Fetch rates & rooms after hotel info succeeds.
      const roomPayload = mapper.mapHotelRoomRequest(cachedHotel, searchSession);
      const rawRooms = await client.hotelRoom(roomPayload, correlationId);
      const normalizedRooms = mapper.mapHotelRoomResponse(rawRooms, nights);

      // If no rooms were mapped, log the raw response to help debug missing room data
      if (!normalizedRooms.rooms || normalizedRooms.rooms.length === 0) {
        logger.info(`[SRDV Provider] No rooms returned for HotelCode=${infoPayload.HotelCode} (searchId=${searchSession?.criteria?.searchId || 'n/a'})`);
        try {
          logger.debug(`[SRDV Provider] rawRooms for HotelCode=${infoPayload.HotelCode}: ${JSON.stringify(rawRooms)}`);
        } catch (e) {
          logger.debug('[SRDV Provider] rawRooms unavailable for logging');
        }
      }

      const rawHotel = cachedHotel.raw || {};
      const hotelDetails = infoResult?.HotelDetails || {};
      const descriptionFallback = rawHotel.Description || rawHotel.HotelDescription || hotelDetails.Description || hotelDetails.HotelDescription;

      return {
        id: cachedHotel.HotelCode || cachedHotel.id,
        name: cachedHotel.HotelName || cachedHotel.name,
        rating: Number(
          infoResult?.HotelRating ||
          infoResult?.Rating ||
          hotelDetails.StarRating ||
          hotelDetails.Rating ||
          cachedHotel.Rating ||
          cachedHotel.rating ||
          0
        ),
        address: info.address || rawHotel.Address || rawHotel.HotelAddress || rawHotel.address || cachedHotel.Address || cachedHotel.HotelAddress || cachedHotel.address || '',
        description: info.description || stringifyDescription(descriptionFallback) || '',
        imageUrls: info.images.length ? info.images : (cachedHotel.imageUrls || []),
        currency: cachedHotel.currency || 'INR',
        rooms: normalizedRooms.rooms,
        _rawRooms: normalizedRooms._raw,
      };
    } catch (error) {
      logger.error(`[SRDV Provider] getHotelDetails failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Room rates fetcher (delegates to getHotelDetails for unified room rates + info display)
   */
  getHotelRooms: async (params) => {
    return module.exports.getHotelDetails(params);
  },

  /**
   * Rechecks rate availability and cancellation policy before booking (BlockRoom)
   */
  blockRoom: async (params) => {
    try {
      const { cachedRoomDetails, cachedHotel, searchSession, correlationId } = params;
      const nights = nightsBetween(searchSession.criteria.checkIn, searchSession.criteria.checkOut);

      const payload = mapper.mapBlockRoomRequest(cachedRoomDetails, cachedHotel, searchSession);
      const rawResult = await client.blockRoom(payload, correlationId);

      // Enrich hotelCard with latest supplier info (hotel description/address/rating/images)
      const hotelCard = {
        id: cachedHotel.HotelCode || cachedHotel.id,
        name: cachedHotel.HotelName || cachedHotel.name,
        rating: Number(cachedHotel.Rating || cachedHotel.rating || 0),
        address: cachedHotel.HotelAddress || cachedHotel.address || '',
      };

      try {
        const infoPayload = {
          SrdvType: searchSession.srdvType,
          SrdvIndex: cachedHotel.SrdvIndex || cachedHotel.srdvIndex || 1,
          TraceId: searchSession.traceId,
          ResultIndex: cachedHotel.ResultIndex || cachedHotel.resultIndex,
          HotelCode: cachedHotel.HotelCode || cachedHotel.hotelCode || cachedHotel.id,
        };
        const rawInfo = await client.hotelInfo(infoPayload, correlationId);
        const infoResult = rawInfo.GetHotelInfoResult || rawInfo.HotelInfoResult || rawInfo;
        if (infoResult && !(infoResult?.Error && infoResult.Error.ErrorCode !== 0)) {
          const hotelDetails = infoResult.HotelDetails || {};
          const rawDescription = hotelDetails.Description || hotelDetails.HotelDescription || infoResult.Description || infoResult.HotelDescription;
          const description = stringifyDescription(rawDescription);
          const address = infoResult.Address || hotelDetails.Address || hotelDetails.AddressLine1 || [hotelDetails.City, hotelDetails.CountryName].filter(Boolean).join(', ');
          const images = infoResult.Images || hotelDetails.Images || (hotelDetails.HotelPicture ? ([]).concat(hotelDetails.HotelPicture) : []);
          const rating = Number(infoResult.HotelRating || infoResult.Rating || hotelDetails.StarRating || hotelDetails.Rating || hotelCard.rating || 0);

          hotelCard.description = description || hotelCard.description;
          hotelCard.address = address || hotelCard.address;
          hotelCard.imageUrls = images.length ? images : (cachedHotel.imageUrls || []);
          hotelCard.rating = rating;

          // attempt to set a fromPrice if available in cached raw hotel
          const rawHotel = cachedHotel.raw || {};
          const minPriceMajor = parseFloat(
            rawHotel.MinPrice?.OfferedPrice || rawHotel.Price?.OfferedPrice || rawHotel.OfferedPrice || rawHotel.MinPrice || rawHotel.Price || 0,
          ) || 0;
          if (minPriceMajor > 0) {
            hotelCard.fromPrice = { amountMinor: Math.round(minPriceMajor * 100), currency: rawHotel.CurrencyCode || cachedHotel.currency || 'INR' };
          }
        }
      } catch (e) {
        logger.info(`[SRDV Provider] hotelInfo enrichment failed during blockRoom for ${cachedHotel?.HotelCode || cachedHotel?.id}: ${e.message}`);
      }

      const normalized = mapper.mapBlockRoomResponse(rawResult, hotelCard, nights);
      return normalized;
    } catch (error) {
      logger.error(`[SRDV Provider] blockRoom failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Submits booking details to confirm reservation (Book)
   */
  book: async (params) => {
    try {
      const { booking, recheckSnapshot, correlationId } = params;
      const payload = mapper.mapBookRequest(booking, recheckSnapshot);
      const rawResult = await client.book(payload, correlationId);
      const normalized = mapper.mapBookResponse(rawResult);
      return normalized;
    } catch (error) {
      logger.error(`[SRDV Provider] book failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Polls/queries booking detail to check status of a pending provider reservation
   */
  getBookingStatus: async (params) => {
    try {
      const { providerBookingId, bookingRefNo, correlationId } = params;
      const payload = {
        BookingId: Number(providerBookingId),
        BookingRefNo: bookingRefNo,
      };
      const rawResult = await client.hotelBookingDetail(payload, correlationId);
      const normalized = mapper.mapBookingDetailResponse(rawResult);
      return normalized;
    } catch (error) {
      logger.error(`[SRDV Provider] getBookingStatus failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Cancels a supplier reservation (HotelCancel)
   */
  cancelBooking: async (params) => {
    try {
      const { booking, correlationId } = params;
      const payload = mapper.mapCancelRequest(booking);
      const rawResult = await client.hotelCancel(payload, correlationId);
      const normalized = mapper.mapCancelResponse(rawResult);
      return normalized;
    } catch (error) {
      logger.error(`[SRDV Provider] cancelBooking failed: ${error.message}`);
      throw error;
    }
  },
};
