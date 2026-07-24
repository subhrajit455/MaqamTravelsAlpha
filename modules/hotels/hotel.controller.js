const hotelSearchUseCase = require('./application/hotel-search.usecase');
const hotelBookingUseCase = require('./application/hotel-booking.usecase');
const hotelCancelUseCase = require('./application/hotel-cancel.usecase');
const hotelBookingService = require('./hotel-booking.service');
const { tryAuthenticate } = require('../../middleware/auth');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { searchCities, getAllCities } = require('../../utils/hotelCityMap');

/**
 * normalizeSearchPayload
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts the simplified user-facing payload into the full internal criteria
 * expected by the hotel search use-case and SRDV mapper.
 *
 * Auto-derives:
 *   countryCode     ← from city map when cityName is supplied
 *   guestNationality← defaults to 'IN' (or derived countryCode)
 *   currency        ← defaults to 'INR'
 *   rooms[]         ← built from top-level adults / children / childAges / numRooms
 *                     (when the caller does not pass a full rooms[] array)
 */
const normalizeSearchPayload = (body) => {
  // ── 1. Resolve countryCode ───────────────────────────────────────────────
  let countryCode = (body.countryCode || '').trim().toUpperCase();
  if (!countryCode && body.cityName) {
    const match = searchCities(body.cityName, 1);
    if (match.length > 0) countryCode = match[0].countryCode;
  }
  countryCode = countryCode || 'IN';

  // ── 2. Guest nationality & currency defaults ─────────────────────────────
  const guestNationality = (body.guestNationality || 'IN').trim().toUpperCase();
  const currency = (body.currency || 'INR').trim().toUpperCase();

  // ── 3. Build rooms array from shorthand fields ────────────────────────────
  let rooms = body.rooms;
  if (!Array.isArray(rooms) || rooms.length === 0) {
    const numRooms = Math.max(1, parseInt(body.numRooms || 1, 10));
    const adults   = Math.max(1, parseInt(body.adults   || 1, 10));
    const children = Math.max(0, parseInt(body.children || 0, 10));
    const childAges = Array.isArray(body.childAges) ? body.childAges : [];
    rooms = Array.from({ length: numRooms }, () => ({ adults, children, childAges }));
  }

  // Return merged payload — original fields preserved, derived ones added/overridden
  return {
    ...body,
    countryCode,
    guestNationality,
    currency,
    rooms,
  };
};

const isDeveloperView = (user) => {
  return user && ['admin', 'super_admin'].includes(user.role);
};

const filterSearchResult = (result, developerView) => {
  if (developerView) return result;
  return {
    ...result,
    hotels: result.hotels.map((hotel) => ({
      ...hotel,
      fromPrice: {
        // ── Show this on the hotel search card ────────────────────────────────
        perNightPrice: hotel.fromPrice?.perNightPrice,  // e.g. 4520.09  → "₹4,520 / night"
        // ── Show this on the checkout / booking summary page ─────────────────
        totalPrice:    hotel.fromPrice?.totalPrice,     // e.g. 9040.18  → "₹9,040 for 2 nights"
        nights:        hotel.fromPrice?.nights,         // e.g. 2
        currency:      hotel.fromPrice?.currency,       // "INR"
      },
    })),
  };
};

const filterHotelDetailsResult = (result, developerView) => {
  if (developerView) return result;
  return {
    ...result,
    rooms: result.rooms.map(({ priceSnapshot, srdvRoomDetails, ...room }) => room),
  };
};

const filterRecheckResult = (result, developerView) => {
  if (developerView) return result;

  return {
    ...result,
    hotel: {
      ...result.hotel,
      fromPrice: result.hotel.fromPrice ? {
        totalPrice:    result.hotel.fromPrice?.totalPrice,
        perNightPrice: result.hotel.fromPrice?.perNightPrice,
        nights:        result.hotel.fromPrice?.nights,
        currency:      result.hotel.fromPrice?.currency,
      } : undefined,
    },
    roomSnapshots: result.roomSnapshots.map(({ priceSnapshot, srdvRoomDetails, ...room }) => room),
  };
};

const searchHotels = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const user = await tryAuthenticate(req);
  const developerView = isDeveloperView(user);
  // Normalize simplified payload → full internal criteria before forwarding
  const criteria = normalizeSearchPayload(req.body);
  const result = await hotelSearchUseCase.searchHotels({ ...criteria, correlationId });
  const filtered = filterSearchResult(result, developerView);
  return sendSuccess(res, { message: 'Hotels found', data: filtered });
};

const debugSearchSession = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const cache = require('../../utils/cache');
  const searchId = req.params.searchId;
  if (!searchId) return res.status(400).json({ success: false, message: 'searchId required' });
  const session = await cache.get(`hotel:search:${searchId}`);
  if (!session) return res.status(404).json({ success: false, message: 'Search session not found' });
  return sendSuccess(res, { message: 'Search session', data: session });
};

const getHotelDetails = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const user = await tryAuthenticate(req);
  const developerView = isDeveloperView(user);
  const result = await hotelSearchUseCase.getHotelDetails({
    searchId: req.query.searchId,
    hotelId: req.params.hotelId,
    correlationId,
  });
  const filtered = filterHotelDetailsResult(result, developerView);
  return sendSuccess(res, { message: 'Hotel details', data: filtered });
};

const recheck = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const user = await tryAuthenticate(req);
  const developerView = isDeveloperView(user);
  const result = await hotelSearchUseCase.recheck({ ...req.body, correlationId });
  const filtered = filterRecheckResult(result, developerView);
  return sendSuccess(res, { message: 'Hotel room rechecked', data: filtered });
};

const createBooking = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const idempotencyKey = req.headers['idempotency-key'] || '';

  const result = await hotelBookingUseCase.createBooking({
    userId: req.user._id,
    recheckId: req.body.recheckId,
    guests: req.body.guests,
    acceptChanges: req.body.acceptChanges,
    idempotencyKey,
    correlationId,
  });

  return sendCreated(res, result, 'Hotel booking is awaiting payment');
};

const getMyBookings = async (req, res) => {
  const result = await hotelBookingService.listBookings(req.user._id, req.query);
  return sendSuccess(res, {
    message: 'Hotel bookings found',
    data: result.bookings,
    meta: { total: result.total, page: result.page, limit: result.limit },
  });
};

const getBooking = async (req, res) => {
  const result = await hotelBookingService.getBookingForUser(req.params.id, req.user._id);
  return sendSuccess(res, { message: 'Hotel booking found', data: result });
};

const cancelBooking = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const result = await hotelCancelUseCase.cancelBooking({
    bookingId: req.params.id,
    userId: req.user._id,
    correlationId,
  });
  return sendSuccess(res, { message: 'Hotel cancellation processed', data: result });
};

const searchHotelCities = (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return sendSuccess(res, { message: 'City suggestions', data: getAllCities() });
  }
  const suggestions = searchCities(query, 15);
  return sendSuccess(res, { message: 'City suggestions', data: suggestions });
};

module.exports = { searchHotels, searchHotelCities, getHotelDetails, recheck, createBooking, getMyBookings, getBooking, cancelBooking, debugSearchSession };
