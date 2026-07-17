const { body, param, query, header } = require('express-validator');

const roomValidator = body('rooms').isArray({ min: 1, max: 8 }).withMessage('At least one room is required.');
const roomFields = [
  body('rooms.*.adults').isInt({ min: 1, max: 8 }).withMessage('Each room needs 1 to 8 adults.'),
  body('rooms.*.children').optional().isInt({ min: 0, max: 6 }),
  body('rooms.*.childAges').optional().isArray({ max: 6 }),
  body('rooms.*.childAges.*').optional().isInt({ min: 0, max: 17 }),
];

const validateSearch = () => [
  body('cityId').trim().notEmpty().withMessage('SRDV/provider cityId is required.'),
  body('countryCode').trim().isLength({ min: 2, max: 2 }).toUpperCase(),
  body('checkIn').isISO8601().toDate().custom((checkIn) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) throw new Error('Check-in must be today or later.');
    return true;
  }),
  body('checkOut').isISO8601().toDate().custom((checkOut, { req }) => {
    if (checkOut <= req.body.checkIn) throw new Error('Check-out must be after check-in.');
    return true;
  }),
  body('guestNationality').trim().isLength({ min: 2, max: 2 }).toUpperCase(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).toUpperCase(),
  roomValidator, ...roomFields,
  body('rooms.*.childAges').optional().custom((ages, { req, path }) => {
    const index = Number(path.match(/rooms\[(\d+)\]/)?.[1]);
    const children = req.body.rooms[index]?.children || 0;
    if (ages.length !== children) throw new Error('childAges must have one age for each child.');
    return true;
  }),
  body('minRating').optional().isInt({ min: 1, max: 5 }),
  body('maxRating').optional().isInt({ min: 1, max: 5 }),
];

const validateHotelId = () => [param('hotelId').trim().notEmpty(), query('searchId').isUUID().withMessage('Valid searchId is required.')];
const validateRecheck = () => [
  body('searchId').isUUID(), body('hotelId').trim().notEmpty(),
  body('selectedRooms').isArray({ min: 1, max: 8 }),
  body('selectedRooms.*.roomId').trim().notEmpty(), body('selectedRooms.*.quantity').optional().isInt({ min: 1, max: 8 }),
];
const validateCreateBooking = () => [
  header('Idempotency-Key').optional().trim().notEmpty().withMessage('Idempotency-Key header must be a non-empty string when provided.'),
  body('recheckId').isUUID(), body('acceptChanges').optional().isBoolean(),
  body('guests').isArray({ min: 1, max: 32 }),
  body('guests.*.title').trim().notEmpty(), body('guests.*.firstName').trim().notEmpty(), body('guests.*.lastName').trim().notEmpty(),
  body('guests.*.type').isIn(['adult', 'child']), body('guests.*.email').optional().isEmail(), body('guests.*.phone').optional().trim().notEmpty(),
];
const validateBookingId = () => [param('id').isMongoId()];
const validateListBookings = () => [query('page').optional().isInt({ min: 1 }).toInt(), query('limit').optional().isInt({ min: 1, max: 100 }).toInt()];

module.exports = { validateSearch, validateHotelId, validateRecheck, validateCreateBooking, validateBookingId, validateListBookings };
