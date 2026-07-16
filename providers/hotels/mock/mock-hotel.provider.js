const crypto = require('crypto');
const hotels = require('./mock-hotel.data');
const { AppError } = require('../../../middleware/errorHandler');

const clone = (value) => JSON.parse(JSON.stringify(value));
const nightsBetween = (checkIn, checkOut) => Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
const findHotel = (hotelId) => hotels.find((hotel) => hotel.id === hotelId);

const publicHotel = (hotel, nights) => ({
  id: hotel.id, name: hotel.name, rating: hotel.rating, address: hotel.address, amenities: hotel.amenities,
  currency: 'INR', minPrice: Math.min(...hotel.rooms.map((room) => room.price)) * nights,
});

const searchHotels = async ({ cityId, countryCode, checkIn, checkOut, minRating, maxRating }) => {
  const nights = nightsBetween(checkIn, checkOut);
  const results = hotels
    .filter((hotel) => (!cityId || hotel.cityId === cityId) && (!countryCode || hotel.countryCode === countryCode))
    .filter((hotel) => !minRating || hotel.rating >= minRating)
    .filter((hotel) => !maxRating || hotel.rating <= maxRating)
    .map((hotel) => publicHotel(hotel, nights));
  return { provider: 'mock', traceId: `mock-${crypto.randomUUID()}`, hotels: results };
};

const getHotelDetails = async ({ hotelId, checkIn, checkOut, rooms }) => {
  const hotel = findHotel(hotelId);
  if (!hotel) throw new AppError('Hotel not found', 404);
  const nights = nightsBetween(checkIn, checkOut);
  const largestRoom = Math.max(...rooms.map((room) => room.adults + room.children));
  return {
    ...publicHotel(hotel, nights),
    rooms: hotel.rooms.filter((room) => room.capacity >= largestRoom).map((room) => ({
      ...clone(room), totalPrice: room.price * nights, currency: 'INR', nights,
    })),
  };
};

const getHotelRooms = getHotelDetails;

const blockRoom = async ({ hotelId, selectedRooms, checkIn, checkOut, mockScenario }) => {
  const hotel = findHotel(hotelId);
  if (!hotel) throw new AppError('Hotel not found', 404);
  const nights = nightsBetween(checkIn, checkOut);
  const roomSnapshots = selectedRooms.map(({ roomId, quantity = 1 }) => {
    const room = hotel.rooms.find((candidate) => candidate.id === roomId);
    if (!room) throw new AppError('Selected room is not available for this hotel', 400);
    const priceMultiplier = mockScenario === 'price_changed' ? 1.1 : 1;
    const policyChanged = mockScenario === 'policy_changed';
    return {
      ...clone(room), quantity, nights, currency: 'INR',
      totalPrice: Math.round(room.price * quantity * nights * priceMultiplier),
      cancellationPolicy: policyChanged ? 'Free cancellation until 24 hours before check-in.' : room.cancellationPolicy,
    };
  });
  return {
    provider: 'mock', providerReference: `mock-block-${crypto.randomUUID()}`,
    hotel: publicHotel(hotel, nights), roomSnapshots,
    price: { currency: 'INR', total: roomSnapshots.reduce((sum, room) => sum + room.totalPrice, 0) },
    cancellationPolicy: roomSnapshots.map((room) => room.cancellationPolicy),
    priceChanged: mockScenario === 'price_changed', policyChanged: mockScenario === 'policy_changed',
  };
};

const book = async ({ booking, mockScenario }) => {
  if (mockScenario === 'book_failure') return { status: 'failed', failureReason: 'Mock supplier could not confirm inventory.' };
  const providerBookingId = `mock-book-${crypto.randomUUID()}`;
  if (mockScenario === 'provider_pending') return { status: 'pending', providerBookingId, bookingRefNo: providerBookingId };
  return { status: 'confirmed', providerBookingId, bookingRefNo: providerBookingId, confirmationNo: `MC-${Date.now()}`, voucherStatus: true, booking };
};

const getBookingStatus = async ({ providerBookingId }) => ({ status: 'confirmed', providerBookingId, voucherStatus: true });
const cancelBooking = async ({ providerBookingId }) => ({ status: 'cancelled', providerBookingId, cancellationReference: `mock-cancel-${crypto.randomUUID()}` });

module.exports = { searchHotels, getHotelDetails, getHotelRooms, blockRoom, book, getBookingStatus, cancelBooking };
