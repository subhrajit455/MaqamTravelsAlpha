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
        info.description = infoResult.Description || infoResult.HotelDetails?.Description || '';
        info.images = infoResult.Images || infoResult.HotelDetails?.Images || info.images;
      }

      // Fetch rates & rooms after hotel info succeeds.
      const roomPayload = mapper.mapHotelRoomRequest(cachedHotel, searchSession);
      const rawRooms = await client.hotelRoom(roomPayload, correlationId);
      const normalizedRooms = mapper.mapHotelRoomResponse(rawRooms, nights);

      return {
        id: cachedHotel.HotelCode || cachedHotel.id,
        name: cachedHotel.HotelName || cachedHotel.name,
        rating: Number(cachedHotel.Rating || cachedHotel.rating || 0),
        address: info.address,
        description: info.description,
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

      const hotelCard = {
        id: cachedHotel.HotelCode || cachedHotel.id,
        name: cachedHotel.HotelName || cachedHotel.name,
        rating: Number(cachedHotel.Rating || cachedHotel.rating || 0),
        address: cachedHotel.HotelAddress || cachedHotel.address || '',
      };

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
