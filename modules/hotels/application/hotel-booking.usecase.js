'use strict';

/**
 * modules/hotels/application/hotel-booking.usecase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Clean Architecture Booking Use-cases for Hotels.
 * Handles Booking Creation, Outbox Events, and Async Payment Confirmation.
 */

const mongoose = require('mongoose');
const cache = require('../../../utils/cache');
const { AppError } = require('../../../middleware/errorHandler');
const HotelBooking = require('../hotel.model');
const HotelBookingEvent = require('../domain/hotel-booking-event.model');
const OutboxEvent = require('../domain/outbox-event.model');
const { HOTEL_BOOKING_STATUS, QUEUES } = require('../hotel.constants');
const logger = require('../../../utils/logger');

// Queue instance placeholder (wired up in the worker/init step)
let _hotelQueue = null;

const getQueue = () => {
  if (_hotelQueue) return _hotelQueue;
  const { Queue } = require('bullmq');
  const { getBullMQConnection } = require('../../../utils/redis');
  
  try {
    const connection = getBullMQConnection();
    _hotelQueue = new Queue(QUEUES.HOTEL_BOOK, { connection });
    logger.info('[BullMQ] Hotel booking queue initialized.');
    return _hotelQueue;
  } catch (err) {
    logger.error(`[BullMQ] Failed to initialize hotel booking queue: ${err.message}`);
    return null;
  }
};

/**
 * Atomically consumes recheckId and creates local HotelBooking in PAYMENT_PENDING
 */
const createBooking = async ({ userId, recheckId, guests, acceptChanges }) => {
  // 1. Atomically consume recheckId from Redis (single-use token enforcement)
  const recheck = await cache.consume(`hotel:recheck:${recheckId}`);
  if (!recheck) {
    // Check if booking already exists for this recheckId (idempotency check)
    const existing = await HotelBooking.findOne({ userId, recheckId });
    if (existing) {
      return existing;
    }
    throw new AppError('Booking quote expired or already processed. Please recheck and try again.', 410);
  }

  const { providerResult, searchSession, hotelId, sellingQuote } = recheck;

  // 2. Validate price/policy changes approval
  if ((providerResult.priceChanged || providerResult.policyChanged) && !acceptChanges) {
    throw new AppError('Price or cancellation policy has changed. Please confirm and accept the new terms.', 409);
  }

  // 3. Perform database operations in transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find SrdvIndex & ResultIndex for mapping Book request later
    const cachedHotel = searchSession.hotels.find((h) => h.HotelCode === hotelId) || {};

    const bookingData = {
      userId,
      provider: 'srdv',
      status: HOTEL_BOOKING_STATUS.AWAITING_PAYMENT,
      searchId: recheck.searchId,
      recheckId,
      traceId: searchSession.traceId,
      srdvType: searchSession.srdvType,
      srdvIndex: cachedHotel.SrdvIndex || 1,
      resultIndex: cachedHotel.ResultIndex || 0,
      srdvHotelId: hotelId,
      hotelName: providerResult.hotel.name,
      destination: providerResult.hotel.address,
      checkIn: searchSession.criteria.checkIn,
      checkOut: searchSession.criteria.checkOut,
      hotelSnapshot: providerResult.hotel,
      roomSnapshots: providerResult.roomSnapshots,
      guests,
      priceSnapshot: sellingQuote,
      cancellationPolicySnapshot: providerResult.cancellationPolicy,
      totalPrice: sellingQuote.customerTotalMinor / 100, // major unit for backward compat
      currency: sellingQuote.currency,
      
      // Minor units
      supplierAmountMinor: sellingQuote.supplierAmountMinor,
      customerTotalMinor: sellingQuote.customerTotalMinor,
      markupMinor: sellingQuote.markupMinor,
      feeMinor: sellingQuote.feeMinor,
      pricingVersion: sellingQuote.pricingVersion,
    };

    const [booking] = await HotelBooking.create([bookingData], { session });

    // Sequence 1: awaiting_payment audit event
    await HotelBookingEvent.create([{
      bookingId: booking._id,
      sequence: 1,
      fromStatus: 'none',
      toStatus: HOTEL_BOOKING_STATUS.AWAITING_PAYMENT,
      actor: 'user',
      reason: 'Booking initiated by customer',
      correlationId: searchSession.traceId,
    }], { session });

    // Write to Transactional Outbox
    await OutboxEvent.create([{
      aggregateType: 'HotelBooking',
      aggregateId: booking._id,
      eventType: 'BOOKING_CREATED',
      payload: { bookingId: booking._id, userId, totalPrice: booking.totalPrice },
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return booking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`[Booking Use Case] Transaction aborted during createBooking: ${error.message}`);
    throw error;
  }
};

/**
 * Moves status to PAYMENT_RECEIVED and enqueues async BullMQ supplier book worker
 */
const confirmBookingAfterPayment = async ({ bookingId, payment }) => {
  const booking = await HotelBooking.findById(bookingId);
  if (!booking) throw new AppError('Hotel booking not found.', 404);

  // If already confirmed or failed, do not repeat
  if ([HOTEL_BOOKING_STATUS.CONFIRMED, HOTEL_BOOKING_STATUS.PROVIDER_PENDING, HOTEL_BOOKING_STATUS.PROVIDER_FAILED].includes(booking.status)) {
    return booking;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalStatus = booking.status;
    booking.paymentId = payment._id;
    booking.status = HOTEL_BOOKING_STATUS.PAYMENT_RECEIVED;
    await booking.save({ session });

    // Sequence 2: payment_received audit event
    await HotelBookingEvent.create([{
      bookingId: booking._id,
      sequence: 2,
      fromStatus: originalStatus,
      toStatus: HOTEL_BOOKING_STATUS.PAYMENT_RECEIVED,
      actor: 'system',
      reason: `Payment verified. ID: ${payment._id}`,
    }], { session });

    // Outbox: PAYMENT_RECEIVED
    await OutboxEvent.create([{
      aggregateType: 'HotelBooking',
      aggregateId: booking._id,
      eventType: 'PAYMENT_RECEIVED',
      payload: { bookingId: booking._id, paymentId: payment._id },
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // 4. Enqueue BullMQ job for supplier booking (hotel-book worker)
    const queue = getQueue();
    if (queue) {
      const jobId = `hotel-book:${booking._id}`;
      await queue.add('book', { bookingId: booking._id }, { jobId, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      logger.info(`[Booking Use Case] Enqueued async book job ${jobId} on BullMQ.`);
    } else {
      logger.warn(`[Booking Use Case] BullMQ not active. Supplying booking synchronous fallback.`);
      // Direct call fallback if Redis URL is absent (helps local setup without redis)
      setTimeout(async () => {
        try {
          const { processSupplierBooking } = require('../../../workers/hotels/hotel-book.worker');
          await processSupplierBooking(booking._id);
        } catch (err) {
          logger.error(`[Booking Use Case] Synchronous book fallback failed: ${err.message}`);
        }
      }, 100);
    }

    return booking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`[Booking Use Case] Transaction aborted during confirmBookingAfterPayment: ${error.message}`);
    throw error;
  }
};

module.exports = { createBooking, confirmBookingAfterPayment };
