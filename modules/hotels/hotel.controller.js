const hotelSearch = require('./hotel-search.service');
const hotelBooking = require('./hotel-booking.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const searchHotels = async (req, res) => sendSuccess(res, { message: 'Hotels found', data: await hotelSearch.searchHotels(req.body) });
const getHotelDetails = async (req, res) => sendSuccess(res, { message: 'Hotel details', data: await hotelSearch.getHotelDetails({ searchId: req.query.searchId, hotelId: req.params.hotelId }) });
const recheck = async (req, res) => sendSuccess(res, { message: 'Hotel room rechecked', data: await hotelSearch.recheck(req.body) });
const createBooking = async (req, res) => sendCreated(res, await hotelBooking.createBooking({ userId: req.user._id, ...req.body }), 'Hotel booking is awaiting payment');
const getMyBookings = async (req, res) => {
  const result = await hotelBooking.listBookings(req.user._id, req.query);
  return sendSuccess(res, { message: 'Hotel bookings found', data: result.bookings, meta: { total: result.total, page: result.page, limit: result.limit } });
};
const getBooking = async (req, res) => sendSuccess(res, { message: 'Hotel booking found', data: await hotelBooking.getBookingForUser(req.params.id, req.user._id) });
const cancelBooking = async (req, res) => sendSuccess(res, { message: 'Hotel cancellation processed', data: await hotelBooking.cancelBooking({ bookingId: req.params.id, userId: req.user._id }) });

module.exports = { searchHotels, getHotelDetails, recheck, createBooking, getMyBookings, getBooking, cancelBooking };
