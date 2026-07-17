const hotelSearchUseCase = require('./application/hotel-search.usecase');
const hotelBookingUseCase = require('./application/hotel-booking.usecase');
const hotelCancelUseCase = require('./application/hotel-cancel.usecase');
const hotelBookingService = require('./hotel-booking.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const searchHotels = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const result = await hotelSearchUseCase.searchHotels({ ...req.body, correlationId });
  return sendSuccess(res, { message: 'Hotels found', data: result });
};

const getHotelDetails = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const result = await hotelSearchUseCase.getHotelDetails({
    searchId: req.query.searchId,
    hotelId: req.params.hotelId,
    correlationId,
  });
  return sendSuccess(res, { message: 'Hotel details', data: result });
};

const recheck = async (req, res) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || '';
  const result = await hotelSearchUseCase.recheck({ ...req.body, correlationId });
  return sendSuccess(res, { message: 'Hotel room rechecked', data: result });
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

module.exports = { searchHotels, getHotelDetails, recheck, createBooking, getMyBookings, getBooking, cancelBooking };
