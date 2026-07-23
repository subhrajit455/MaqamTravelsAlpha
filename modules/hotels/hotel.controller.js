const hotelSearchUseCase = require('./application/hotel-search.usecase');
const hotelBookingUseCase = require('./application/hotel-booking.usecase');
const hotelCancelUseCase = require('./application/hotel-cancel.usecase');
const hotelBookingService = require('./hotel-booking.service');
const { tryAuthenticate } = require('../../middleware/auth');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

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
        amountMinor: hotel.fromPrice?.amountMinor,
        currency: hotel.fromPrice?.currency,
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
      fromPrice: {
        amountMinor: result.hotel.fromPrice?.amountMinor,
        currency: result.hotel.fromPrice?.currency,
      },
    },
    roomSnapshots: result.roomSnapshots.map(({ priceSnapshot, srdvRoomDetails, ...room }) => room),
  };
};

const searchHotels = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const user = await tryAuthenticate(req);
  const developerView = isDeveloperView(user);
  const result = await hotelSearchUseCase.searchHotels({ ...req.body, correlationId });
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

module.exports = { searchHotels, getHotelDetails, recheck, createBooking, getMyBookings, getBooking, cancelBooking, debugSearchSession };
