---
sidebar_position: 3
---

# Hotels Module

> The authoritative production target and source-code audit is [Production Hotel Booking Architecture](./hotel-booking-architecture). This page is a short module overview.

The hotels module is the starting point for hotel discovery and, later, hotel reservations. It is mounted at `/api/v1/hotels`.

## Current status

The module includes mock-first search, details, recheck, local booking, payment-to-provider orchestration, a pending-status helper, and cancellation routes. Its SRDV adapter remains intentionally disabled, and it uses an in-process cache and synchronous provider call, so it must not be treated as production-ready.

| Capability                     | Status              | Notes                                                                                  |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------- |
| Search, details and recheck    | Mock implementation | Public routes exist; live SRDV mapping is not implemented.                             |
| Local booking                  | Mock implementation | Creates an immutable mock snapshot pending payment.                                    |
| Payment/provider orchestration | Mock implementation | Current path calls provider work synchronously; production must use outbox and BullMQ. |
| My bookings / cancellation     | Mock implementation | Routes exist; supplier cancellation/refund calculation is still required.              |

## Current files

| File                                     | Responsibility                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `modules/hotels/hotel.routes.js`         | HTTP routes and validation wiring.                                            |
| `modules/hotels/hotel.controller.js`     | Translates HTTP input into service calls.                                     |
| `modules/hotels/hotel.service.js`        | Hotel-domain orchestration.                                                   |
| `modules/hotels/hotel.validator.js`      | Request validation rules.                                                     |
| `modules/hotels/hotel.model.js`          | Persistent `HotelBooking` record.                                             |
| `modules/hotels/hotelInventory.model.js` | Local/demo `Hotel` inventory model; it is not the live SRDV inventory source. |
| `providers/srdv/srdv.client.js`          | Raw provider HTTP calls.                                                      |
| `providers/srdv/srdv.adapter.js`         | Provider-response normalization boundary.                                     |

## Intended API contract

Use a request body for search because dates, guests, rooms, filters, and pagination do not fit well in a query string. The recommended endpoint is:

```http
POST /api/v1/hotels/search
Content-Type: application/json

{
  "destination": "Makkah",
  "checkIn": "2026-10-14",
  "checkOut": "2026-10-18",
  "guests": 2,
  "rooms": 1,
  "page": 1,
  "limit": 10
}
```

## Developer references

- [SRDV Hotel API Analysis](./srdv-hotel-api-analysis)
- [SRDV Hotel API Full Flow](./srdv-hotel-api-full-flow)
- [Production Hotel Booking Architecture](./hotel-booking-architecture)

The current code already uses `POST /search`, validates a provider city ID, country, dates, nationality and per-room guests, and keeps `GET /:hotelId` for details lookup.

## Historic implementation notes (superseded)

The list below predates the current mock-first module and is retained only for context. Follow the implementation plan in the production architecture document instead.

1. Add `searchHotels` and `getHotelDetails` to the SRDV client, using the real provider endpoints and request schema.
2. Normalize provider responses in `srdv.adapter.js`; controllers should never expose a provider-specific payload directly.
3. Change search to `POST`, add `rooms`, and validate that `checkOut` is after `checkIn`.
4. Add a rate-limit-safe cache keyed by destination, dates, guest/room count, and provider credentials context.
5. Add a re-price/availability endpoint before payment; never create a booking from a stale search result.
6. Create a reservation flow: re-price/hold → create pending `HotelBooking` → create payment → confirm provider reservation after verified payment → persist voucher/reference.
7. Add authenticated booking retrieval and cancellation, with provider cancellation policy and refund handling.
8. Add OpenAPI annotations and integration tests for each public endpoint.

## Data ownership

`HotelBooking` should store an immutable snapshot of the selected property, room/rate, guest data, cancellation policy, provider booking reference, and payment link. Live availability and price remain provider-owned and must be revalidated immediately before payment or reservation.

Avoid treating `hotelInventory.model.js` as the source of truth unless the product explicitly supports contracted/local inventory. Its collection name is `Hotel`, while the booking model is registered as `HotelBooking`.

## Definition of done

A hotel booking flow is complete only when a customer can search, select a rate, revalidate it, pay once, receive either a provider confirmation/voucher or a reliable failure/refund outcome, and later retrieve or cancel the booking. Webhook processing must be idempotent.
