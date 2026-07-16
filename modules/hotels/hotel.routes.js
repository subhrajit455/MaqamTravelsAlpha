const router = require('express').Router();
const controller = require('./hotel.controller');
const validator = require('./hotel.validator');
const validate = require('../../middleware/validate');
const { searchLimiter } = require('../../middleware/rateLimiter');
const { authenticate } = require('../../middleware/auth');

router.post('/search', searchLimiter, validator.validateSearch(), validate, controller.searchHotels);
router.post('/recheck', validator.validateRecheck(), validate, controller.recheck);
router.get('/bookings/me', authenticate, validator.validateListBookings(), validate, controller.getMyBookings);
router.post('/bookings', authenticate, validator.validateCreateBooking(), validate, controller.createBooking);
router.get('/bookings/:id', authenticate, validator.validateBookingId(), validate, controller.getBooking);
router.post('/bookings/:id/cancel', authenticate, validator.validateBookingId(), validate, controller.cancelBooking);
router.get('/:hotelId', validator.validateHotelId(), validate, controller.getHotelDetails);

module.exports = router;
