const HotelBooking = require('../modules/hotels/hotel.model');
const { refreshPendingBooking } = require('../modules/hotels/hotel-booking.service');
const { HOTEL_BOOKING_STATUS } = require('../modules/hotels/hotel.constants');
const logger = require('../utils/logger');

// Invoke from a real queue/scheduler only after SRDV confirms its permitted polling interval.
const reconcilePendingHotelBookings = async ({ limit = 50 } = {}) => {
  const pending = await HotelBooking.find({ status: HOTEL_BOOKING_STATUS.PROVIDER_PENDING })
    .sort({ updatedAt: 1 }).limit(limit).select('_id');
  const results = await Promise.allSettled(pending.map(({ _id }) => refreshPendingBooking(_id)));
  const failed = results.filter((result) => result.status === 'rejected');
  failed.forEach((result) => logger.error(`Hotel pending-status reconciliation failed: ${result.reason.message}`));
  return { processed: results.length, failed: failed.length };
};

module.exports = { reconcilePendingHotelBookings };
