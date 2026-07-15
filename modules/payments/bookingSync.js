const { resolveBooking } = require('./bookingResolver');
const Booking = require('../bookings/booking.model');
const { BOOKING_STATUS, TOUR_STATUS } = require('../../config/constants');

const BOOKING_CONFIRMATION_STATUS = {
    flight: BOOKING_STATUS.CONFIRMED,
    hotel: BOOKING_STATUS.CONFIRMED,
    tour: TOUR_STATUS.BOOKED,
    package: BOOKING_STATUS.CONFIRMED,
};

const getBookingAmount = (booking, bookingType) => {
    if (!booking) return 0;

    switch (bookingType) {
        case 'hotel': 
            return booking.totalPrice || booking.details?.totalPrice || booking.price || 0;
        case 'tour':
            return booking.budget || booking.quotedPrice || booking.totalPrice || booking.details?.totalPrice || 0;
        case 'flight':
            return booking.totalAmount || booking.details?.totalPrice || booking.totalPrice || 0;
        case 'package':
            return booking.price || booking.totalPrice || booking.details?.price || booking.details?.totalPrice || 0;
        default:
            return booking.totalAmount || booking.totalPrice || booking.details?.totalPrice || booking.price || 0;
    }
};

const getBookingConfirmationStatus = (bookingType) => {
    return BOOKING_CONFIRMATION_STATUS[bookingType] || BOOKING_STATUS.CONFIRMED;
};

const resolveMasterBooking = async (booking, bookingType, session = null) => {
    if (!booking) return null;
    if (booking.constructor.modelName === 'Booking') {
        return booking;
    }

    const query = Booking.findOne({ itemId: booking._id, bookingType });
    if (session) query.session(session);
    return await query;
};

const buildMasterBookingDetails = (booking, bookingType, payment) => {
    const details = {
        destination: booking.destination || booking.details?.destination || booking.hotelName || booking.title || null,
        departureDate: booking.checkIn || booking.startDate || booking.departureDate || null,
        returnDate: booking.checkOut || booking.endDate || booking.returnDate || null,
        totalPrice: booking.totalPrice || booking.budget || payment.amount || booking.price || booking.details?.totalPrice || null,
        currency: booking.currency || booking.details?.currency || payment.currency || 'INR',
        passengers: booking.passengers || booking.adultCount || booking.travellers || booking.numberOfGuests || null,
    };

    return Object.entries(details).reduce((acc, [key, value]) => {
        if (value !== null && typeof value !== 'undefined') {
            acc[key] = value;
        }
        return acc;
    }, {});
};

const createOrUpdateMasterBooking = async (payment, booking, session = null) => {
    if (!payment || !booking) return null;

    let masterBooking = await resolveMasterBooking(booking, payment.bookingType, session);
    if (!masterBooking) {
        const userId = payment.userId || booking.user?._id || booking.userId?._id || booking.user || booking.userId;
        const details = buildMasterBookingDetails(booking, payment.bookingType, payment);

        if (!userId) {
            return null;
        }

        const createdBookings = await Booking.create([
            {
                userId,
                bookingType: payment.bookingType,
                itemId: booking._id,
                details,
                status: BOOKING_STATUS.CONFIRMED,
                paymentId: payment._id,
            },
        ], { session });

        masterBooking = createdBookings[0];
    } else {
        masterBooking.status = BOOKING_STATUS.CONFIRMED;
        masterBooking.paymentId = payment._id;
        if (!masterBooking.details?.currency && payment.currency) {
            masterBooking.details = {
                ...masterBooking.details,
                currency: payment.currency,
            };
        }
        await masterBooking.save({ session });
    }

    return masterBooking;
};

const updateBookingConfirmation = async (payment, booking, session = null) => {
    if (!payment || !booking) return null;

    const status = getBookingConfirmationStatus(payment.bookingType);

    if (payment.bookingType !== 'package') {
        booking.status = status;
        if (typeof booking.paymentId !== 'undefined') {
            booking.paymentId = payment._id;
        }
        await booking.save({ session });
    }

    const masterBooking = await createOrUpdateMasterBooking(payment, booking, session);
    return { booking, masterBooking };
};

const ensureBookingConfirmed = async (payment, session = null) => {
    if (!payment) return null;

    const booking = await resolveBooking(payment.bookingId, payment.bookingType);
    if (!booking) return null;

    const status = getBookingConfirmationStatus(payment.bookingType);
    let bookingUpdated = false;

    if (payment.bookingType !== 'package') {
        if (booking.status !== status) {
            booking.status = status;
            bookingUpdated = true;
        }

        if (typeof booking.paymentId !== 'undefined' && booking.paymentId?.toString() !== payment._id.toString()) {
            booking.paymentId = payment._id;
            bookingUpdated = true;
        }
    }

    if (bookingUpdated) {
        await booking.save({ session });
    }

    const masterBooking = await createOrUpdateMasterBooking(payment, booking, session);
    return { booking, masterBooking };
};

module.exports = {
    getBookingAmount,
    updateBookingConfirmation,
    ensureBookingConfirmed,
};
