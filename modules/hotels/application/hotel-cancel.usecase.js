'use strict';

/**
 * modules/hotels/application/hotel-cancel.usecase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean Architecture Hotel Cancellation Use-case.
 * Resolves supplier cancellation fee, creates Refund records, and schedules gateway refunds.
 */

const mongoose = require('mongoose');
const { AppError } = require('../../../middleware/errorHandler');
const HotelBooking = require('../hotel.model');
const HotelBookingEvent = require('../domain/hotel-booking-event.model');
const HotelRefund = require('../domain/hotel-refund.model');
const OutboxEvent = require('../domain/outbox-event.model');
const { HOTEL_BOOKING_STATUS } = require('../hotel.constants');
const { getHotelProvider } = require('../hotel-provider.factory');
const crypto = require('crypto');
const logger = require('../../../utils/logger');

const cancelBooking = async ({ bookingId, userId, correlationId }) => {
  const booking = await HotelBooking.findOne({ _id: bookingId, userId });
  if (!booking) throw new AppError('Hotel booking not found.', 404);

  // If already cancelled or failed, return early
  if ([HOTEL_BOOKING_STATUS.CANCELLED, HOTEL_BOOKING_STATUS.PROVIDER_FAILED].includes(booking.status)) {
    return booking;
  }

  // If not confirmed with supplier yet (payment received but book not done or failed),
  // we can cancel locally directly
  if (!booking.providerBookingId) {
    booking.status = HOTEL_BOOKING_STATUS.CANCELLED;
    await booking.save();
    return booking;
  }

  // Start cancellation process
  booking.status = HOTEL_BOOKING_STATUS.CANCELLATION_REQUESTED;
  await booking.save();

  // Audit event: cancellation_requested
  await HotelBookingEvent.create({
    bookingId: booking._id,
    sequence: 3,
    fromStatus: HOTEL_BOOKING_STATUS.CONFIRMED,
    toStatus: HOTEL_BOOKING_STATUS.CANCELLATION_REQUESTED,
    actor: 'user',
    reason: 'Customer requested cancellation',
    correlationId,
  });

  const provider = getHotelProvider();
  
  try {
    // Call SRDV cancellation
    const result = await provider.cancelBooking({
      booking: booking.toObject(),
      correlationId,
    });

    if (result.status === 'cancelled') {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Calculate penalty in minor units (paise)
        const penaltyMinor = Math.round(result.penalty * 100);
        
        // Customer refund calculation: Total paid minus supplier penalty
        let customerRefundMinor = booking.customerTotalMinor - penaltyMinor;
        if (customerRefundMinor < 0) customerRefundMinor = 0;

        booking.status = HOTEL_BOOKING_STATUS.CANCELLED;
        booking.cancellationReference = result.cancellationReference;
        booking.providerRawResponse = {
          ...booking.providerRawResponse,
          cancellationResult: result.raw,
        };
        await booking.save({ session });

        // Audit event: cancelled
        await HotelBookingEvent.create([{
          bookingId: booking._id,
          sequence: 4,
          fromStatus: HOTEL_BOOKING_STATUS.CANCELLATION_REQUESTED,
          toStatus: HOTEL_BOOKING_STATUS.CANCELLED,
          actor: 'system',
          reason: `Supplier cancellation success. Penalty: ${result.penalty} ${booking.currency}`,
        }], { session });

        // Create explicit refund entry if money is due back
        if (customerRefundMinor > 0 && booking.paymentId) {
          const idempotencyKey = crypto.randomUUID();
          await HotelRefund.create([{
            bookingId: booking._id,
            paymentId: booking.paymentId,
            idempotencyKey,
            status: 'pending',
            customerAmountMinor: customerRefundMinor,
            currency: booking.currency,
            reason: 'Booking cancelled by user',
            supplierCancellationReference: result.cancellationReference,
          }], { session });

          // Transactional Outbox: REFUND_INITIATED (picked up by gateway refund worker)
          await OutboxEvent.create([{
            aggregateType: 'HotelBooking',
            aggregateId: booking._id,
            eventType: 'REFUND_INITIATED',
            payload: {
              bookingId: booking._id,
              paymentId: booking.paymentId,
              refundAmountMinor: customerRefundMinor,
              idempotencyKey,
            },
          }], { session });
        }

        await session.commitTransaction();
        session.endSession();
        
        logger.info(`[Cancel Use Case] Booking ${bookingId} cancelled successfully. Refund due: ${customerRefundMinor / 100}`);
      } catch (dbErr) {
        await session.abortTransaction();
        session.endSession();
        throw dbErr;
      }
    } else {
      // Revert back to confirmed if supplier rejected cancellation
      booking.status = HOTEL_BOOKING_STATUS.CONFIRMED;
      await booking.save();
      
      logger.error(`[Cancel Use Case] Supplier rejected cancellation for booking ${bookingId}`);
      throw new AppError('Supplier could not cancel the booking. Contact support.', 400);
    }

    return booking;
  } catch (error) {
    logger.error(`[Cancel Use Case] Cancellation execution failed: ${error.message}`);
    // Reset booking status to confirmed to prevent stuck states
    booking.status = HOTEL_BOOKING_STATUS.CONFIRMED;
    await booking.save();
    throw error;
  }
};

module.exports = { cancelBooking };
