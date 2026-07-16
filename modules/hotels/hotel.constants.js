const HOTEL_BOOKING_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  PAYMENT_RECEIVED: 'payment_received',
  CONFIRMING_PROVIDER: 'confirming_provider',
  CONFIRMED: 'confirmed',
  PROVIDER_PENDING: 'provider_pending',
  PROVIDER_FAILED: 'provider_failed',
  CANCELLATION_REQUESTED: 'cancellation_requested',
  CANCELLED: 'cancelled',
};

const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;
const RECHECK_CACHE_TTL_MS = 10 * 60 * 1000;

module.exports = { HOTEL_BOOKING_STATUS, SEARCH_CACHE_TTL_MS, RECHECK_CACHE_TTL_MS };
