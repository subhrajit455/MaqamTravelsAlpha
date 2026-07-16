const HotelBooking = require('./hotel.model');
const { AppError } = require('../../middleware/errorHandler');
const { getRecheck } = require('./hotel-search.service');
const { getHotelProvider } = require('./hotel-provider.factory');
const { HOTEL_BOOKING_STATUS } = require('./hotel.constants');
const { withLock } = require('../payments/distributedLock');

const toPublicBooking = (booking) => booking.toObject ? booking.toObject() : booking;

const createBooking = async ({ userId, recheckId, guests, acceptChanges }) => {
  const recheck = getRecheck(recheckId);
  const { providerResult, search, hotelId } = recheck;
  if ((providerResult.priceChanged || providerResult.policyChanged) && !acceptChanges) {
    throw new AppError('Price or cancellation policy changed. Confirm the revised terms before booking.', 409);
  }
  const existing = await HotelBooking.findOne({ userId, recheckId });
  if (existing) return toPublicBooking(existing);
  const booking = await HotelBooking.create({
    userId, provider: providerResult.provider, searchId: recheck.searchId, recheckId,
    traceId: search.traceId, srdvHotelId: hotelId, hotelName: providerResult.hotel.name,
    destination: providerResult.hotel.address, checkIn: search.criteria.checkIn, checkOut: search.criteria.checkOut,
    hotelSnapshot: { ...providerResult.hotel, mockScenario: recheck.mockScenario }, roomSnapshots: providerResult.roomSnapshots, guests,
    priceSnapshot: providerResult.price, cancellationPolicySnapshot: providerResult.cancellationPolicy,
    totalPrice: providerResult.price.total, currency: providerResult.price.currency,
  });
  return toPublicBooking(booking);
};

const getBookingForUser = async (bookingId, userId) => {
  const booking = await HotelBooking.findOne({ _id: bookingId, userId });
  if (!booking) throw new AppError('Hotel booking not found.', 404);
  return booking;
};

const listBookings = async (userId, { page = 1, limit = 20 } = {}) => {
  const [bookings, total] = await Promise.all([
    HotelBooking.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    HotelBooking.countDocuments({ userId }),
  ]);
  return { bookings, total, page, limit };
};

const confirmBookingAfterPayment = async ({ bookingId, payment }) => withLock(`hotel-book:${bookingId}`, 30000, async () => {
  const booking = await HotelBooking.findById(bookingId);
  if (!booking) throw new AppError('Hotel booking not found.', 404);
  if ([HOTEL_BOOKING_STATUS.CONFIRMED, HOTEL_BOOKING_STATUS.PROVIDER_PENDING].includes(booking.status)) return booking;
  if (booking.status === HOTEL_BOOKING_STATUS.PROVIDER_FAILED) return booking;

  booking.paymentId = payment._id;
  booking.status = HOTEL_BOOKING_STATUS.CONFIRMING_PROVIDER;
  await booking.save();
  const result = await getHotelProvider().book({ booking: booking.toObject(), mockScenario: booking.hotelSnapshot?.mockScenario });
  booking.providerRawResponse = result;
  booking.providerBookingId = result.providerBookingId;
  booking.bookingRefNo = result.bookingRefNo;
  booking.confirmationNo = result.confirmationNo;
  booking.voucherStatus = result.voucherStatus;
  if (result.status === 'confirmed') booking.status = HOTEL_BOOKING_STATUS.CONFIRMED;
  else if (result.status === 'pending') booking.status = HOTEL_BOOKING_STATUS.PROVIDER_PENDING;
  else { booking.status = HOTEL_BOOKING_STATUS.PROVIDER_FAILED; booking.failureReason = result.failureReason || 'Supplier booking failed.'; }
  await booking.save();
  return booking;
});

const cancelBooking = async ({ bookingId, userId }) => {
  const booking = await getBookingForUser(bookingId, userId);
  if ([HOTEL_BOOKING_STATUS.CANCELLED, HOTEL_BOOKING_STATUS.PROVIDER_FAILED].includes(booking.status)) return booking;
  if (!booking.providerBookingId) { booking.status = HOTEL_BOOKING_STATUS.CANCELLED; await booking.save(); return booking; }
  booking.status = HOTEL_BOOKING_STATUS.CANCELLATION_REQUESTED;
  await booking.save();
  const result = await getHotelProvider().cancelBooking({ providerBookingId: booking.providerBookingId });
  booking.providerRawResponse = result;
  booking.cancellationReference = result.cancellationReference;
  booking.status = result.status === 'cancelled' ? HOTEL_BOOKING_STATUS.CANCELLED : HOTEL_BOOKING_STATUS.CONFIRMED;
  await booking.save();
  return booking;
};

const refreshPendingBooking = async (bookingId) => {
  const booking = await HotelBooking.findById(bookingId);
  if (!booking) throw new AppError('Hotel booking not found.', 404);
  if (booking.status !== HOTEL_BOOKING_STATUS.PROVIDER_PENDING) return booking;
  const result = await getHotelProvider().getBookingStatus({ providerBookingId: booking.providerBookingId });
  booking.providerRawResponse = result;
  booking.voucherStatus = result.voucherStatus;
  if (result.status === 'confirmed') booking.status = HOTEL_BOOKING_STATUS.CONFIRMED;
  else if (result.status === 'failed') { booking.status = HOTEL_BOOKING_STATUS.PROVIDER_FAILED; booking.failureReason = result.failureReason || 'Supplier booking failed.'; }
  await booking.save();
  return booking;
};

module.exports = { createBooking, getBookingForUser, listBookings, confirmBookingAfterPayment, cancelBooking, refreshPendingBooking };


