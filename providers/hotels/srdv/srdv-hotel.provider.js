const { AppError } = require('../../../middleware/errorHandler');

const unavailable = () => { throw new AppError('SRDV hotel provider is not enabled. Configure HOTEL_PROVIDER=mock until sandbox integration is verified.', 503); };

module.exports = {
  searchHotels: unavailable, getHotelDetails: unavailable, getHotelRooms: unavailable,
  blockRoom: unavailable, book: unavailable, getBookingStatus: unavailable, cancelBooking: unavailable,
};
