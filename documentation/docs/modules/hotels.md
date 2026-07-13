---
sidebar_position: 3
---

# Hotels Module

The hotels module is the starting point for hotel discovery and, later, hotel reservations. It is mounted at `/api/v1/hotels`.

## Current status

Only the read-side API shape exists today. Hotel search and hotel detail routes are registered, but their SRDV integration is incomplete, so they must not be treated as production-ready.

| Capability | Status | Notes |
| --- | --- | --- |
| Search hotels | In progress | Route, validation, controller, and service exist; the SRDV client method is missing. |
| Get hotel details | In progress | Route exists; the SRDV client method is missing. |
| Create reservation | Not implemented | No route or reservation workflow exists. |
| Payment confirmation | Not implemented | Must be coordinated with the payments and bookings modules. |
| My bookings / cancellation | Not implemented | Models exist, but there is no exposed workflow. |

## Current files

| File | Responsibility |
| --- | --- |
| `modules/hotels/hotel.routes.js` | HTTP routes and validation wiring. |
| `modules/hotels/hotel.controller.js` | Translates HTTP input into service calls. |
| `modules/hotels/hotel.service.js` | Hotel-domain orchestration. |
| `modules/hotels/hotel.validator.js` | Request validation rules. |
| `modules/hotels/hotel.model.js` | Persistent `HotelBooking` record. |
| `modules/hotels/hotelInventory.model.js` | Local/demo `Hotel` inventory model; it is not the live SRDV inventory source. |
| `providers/srdv/srdv.client.js` | Raw provider HTTP calls. |
| `providers/srdv/srdv.adapter.js` | Provider-response normalization boundary. |

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

The current code registers `GET /search` but reads `req.body`. That is inconsistent with HTTP client and proxy behaviour, so change the route to `POST /search` before implementing the provider call. Keep `GET /:hotelId` for a details lookup.

## Implementation order

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
