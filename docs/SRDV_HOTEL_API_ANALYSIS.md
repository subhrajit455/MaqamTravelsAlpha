# SRDV Hotel API v8 — Integration Analysis

> Status: implementation guide based on SRDV's public Hotel API v8 documentation, reviewed on 2026-07-13.
>
> This document describes the contract that Maqam Travels should implement. It is **not** a replacement for SRDV's Postman collection: use the collection and sandbox credentials to verify exact JSON samples before enabling production booking.

> For the detailed customer-payment versus SRDV-supplier-settlement design, including recovery and cancellation flows, see [SRDV Hotel Booking and Settlement Flow](/modules/srdv-hotel-booking-settlement-flow).

## 1. Key conclusion

SRDV's Hotel API is a stateful supplier workflow. The correct order is:

```text
Search
  -> Hotel Info (property content, when needed)
  -> Hotel Room (selected property's room/rate details)
  -> BlockRoom (mandatory revalidation of price and cancellation policy)
  -> create local booking awaiting payment
  -> verified payment
  -> Book (hold or voucher/confirm)
  -> HotelBookingDetail polling when SRDV returns Pending
  -> Hotel Cancel when the customer cancels
```

SRDV explicitly recommends `BlockRoom` before `Book`. A successful payment alone is **not** confirmation: `Book` can report a changed price, a changed cancellation policy, failure, or a pending supplier confirmation.

## 2. Environment and authentication

All documented hotel calls include these credentials in the JSON body:

```json
{
  "EndUserIp": "public-end-user-ip",
  "ClientId": "SRDV client id",
  "UserName": "SRDV username",
  "Password": "SRDV password"
}
```

Use environment variables only:

```env
SRDV_API_BASE_HOTEL_URL=https://hotel.srdvtest.com/v8/rest
SRDV_END_USER_IP=
SRDV_CLIENT_ID=
SRDV_USERNAME=
SRDV_PASSWORD=
```

- SRDV documents the **test** base URL as `https://hotel.srdvtest.com/v8/rest`.
- SRDV's current FAQ documents the **live** base URL as `https://hotel.srdvapi.com/v8/rest/`.
- Do not switch to live solely by changing a URL; obtain SRDV live credentials and written approval first.
- The existing `https://hotel.srdv.com/v8/rest` value in `providers/srdv/srdv.client.js` does not match either public SRDV URL and should be verified before use.
- Do not send `X-API-Key` unless SRDV has specifically issued and documented one for this account. Their public Hotel v8 method docs show credentials in the payload.

## 3. Provider methods

| Stage | SRDV method | Purpose | Maqam endpoint |
| --- | --- | --- | --- |
| Discovery | `Search` | Hotel availability for a city and stay | `POST /api/v1/hotels/search` |
| Content | `HotelInfo` | Property details/content | `GET /api/v1/hotels/:hotelId?searchId=...` |
| Rate selection | `HotelRoom` | Room and rate details for a property | internal; returned by details route |
| Revalidation | `BlockRoom` | Recheck current price and cancellation policy | `POST /api/v1/hotels/recheck` |
| Reservation | `Book` | Hold or voucher/confirm reservation | internal after verified payment |
| Supplier status | `HotelBookingDetail` | Poll a pending provider reservation | worker/internal endpoint |
| Cancellation | `HotelCancel` | Cancel a supplier booking | `POST /api/v1/hotels/bookings/:id/cancel` |

`Search` and `Book` URLs are explicitly documented. The Postman collection linked by SRDV must be used to verify the exact method paths and sample bodies for `HotelInfo`, `HotelRoom`, `BlockRoom`, `HotelBookingDetail`, and `HotelCancel`.

## 4. Search contract

### SRDV call

```http
POST {SRDV_API_BASE_HOTEL_URL}/Search
Content-Type: application/json
```

Important documented request fields:

| Field | Notes |
| --- | --- |
| `BookingMode` | SRDV booking mode; confirm permitted value with SRDV. |
| `CheckInDate` | `YYYY-MM-DD`. |
| `NoOfNights` | Minimum 1. Calculate server-side from check-in/check-out. |
| `CountryCode` | Destination country ISO code. |
| `CityId` | SRDV city identifier, not a free-text city name. |
| `PreferredCurrency` | SRDV's requested display/sell currency. Verify accepted values; docs show examples that need sandbox validation. |
| `GuestNationality` | ISO country code; price can vary by nationality. |
| `NoOfRooms` | Number of requested rooms. |
| `RoomGuests[]` | Repeat once for each room; contains adult count, child count and child ages. |
| `PreferredHotel`, `MinRating`, `MaxRating` | Hotel/rating filters. |

Rules:

- `RoomGuests` must have exactly one entry per room.
- Child ages are required whenever a room has children.
- Cache the entire SRDV search context; every later provider call depends on `TraceId`, `SrdvType`, `SrdvIndex`, `ResultIndex`, hotel code, and selected room/rate fields.

### Maqam public request

```json
{
  "cityId": "SRDV_CITY_ID",
  "countryCode": "SA",
  "checkIn": "2026-10-14",
  "checkOut": "2026-10-18",
  "guestNationality": "IN",
  "currency": "INR",
  "rooms": [
    { "adults": 2, "children": 1, "childAges": [7] }
  ],
  "minRating": 3,
  "maxRating": 5
}
```

Do not expose or accept SRDV credentials, `TraceId`, or complete supplier rate objects from the browser.

### Important search response fields to cache

SRDV returns top-level `TraceId` and `SrdvType`; each result includes at least `SrdvIndex`, `ResultIndex`, `HotelCode`, `HotelName`, rating, property data, facilities, rooms, and minimum price data. The price breakdown includes values such as `CurrencyCode`, `RoomPrice`, `Tax`, `OfferedPrice`, GST, TDS, and service charges.

Create an internal `searchId` and cache the raw result plus the normalized result for 10–15 minutes:

```text
hotel:search:{searchId}
```

## 5. Recheck with BlockRoom

`BlockRoom` is the mandatory price/policy revalidation boundary. Use it immediately before payment/booking, not merely when the user opens hotel details.

Maqam request:

```json
{
  "searchId": "opaque-server-search-id",
  "hotelId": "selected-hotel-code",
  "resultIndex": 123,
  "selectedRooms": [{ "roomIndex": 1 }]
}
```

The service retrieves all SRDV fields required for BlockRoom from the cache, calls SRDV, then stores a short-lived recheck snapshot. If SRDV changes price or cancellation policy, return `priceChanged: true` or `policyChanged: true` and require the customer to approve before a payment order is created.

Never use the original search price to create a payment order.

## 6. Booking with Book

### SRDV call

```http
POST {SRDV_API_BASE_HOTEL_URL}/Book
```

The request includes:

- `ResultIndex`, `HotelCode`, `HotelName`, `GuestNationality`, `NoOfRooms`
- `IsVoucherBooking`: `true` vouchers/books directly; `false` holds and vouchers later
- `HotelRoomsDetails[]`: selected rooms including IDs, room/rate plan data, daily rates, complete price data, cancellation policy and amenities
- `HotelPassenger[]` for each room: title, first/last name, phone, email, adult/child type, lead-guest flag; optional PAN
- `SrdvType`, `SrdvIndex`, and `TraceId` from the original search
- SRDV credentials and end-user IP

This means the frontend must not reconstruct a Book payload. Persist the selected/rechecked SRDV room snapshot server-side and build the request there.

### SRDV outcomes to handle

| SRDV condition | Maqam action |
| --- | --- |
| `IsPriceChanged: true` | Do not complete the booking; show revised price and require customer approval/retry. |
| `IsCancellationPolicyChanged: true` | Do not complete silently; show revised policy and require customer approval/retry. |
| `HotelBookingStatus: Confirmed` / voucher status true | Save provider IDs, confirmation number, booking reference, invoice number and voucher data; mark confirmed. |
| `HotelBookingStatus: Pending` | Mark `provider_pending`; poll `HotelBookingDetail` after 5–10 minutes as SRDV directs. |
| Book failure | Mark provider failure, do not call it confirmed, and run the payment recovery/refund workflow. |

On success SRDV returns `BookingId`, `BookingRefNo`, `ConfirmationNo`, `InvoiceNumber`, `TraceId`, voucher status and booking status.

## 7. Payment and booking order

Recommended Maqam sequence:

```text
1. Search hotel
2. Select room/rate
3. BlockRoom recheck
4. Create HotelBooking(status = awaiting_payment) with the immutable recheck snapshot
5. Create gateway order from the stored server-side amount
6. Verify gateway callback/signature
7. Lock HotelBooking and call SRDV Book
8. Update booking to confirmed, provider_pending, or provider_failed
9. Only after SRDV confirmation, create/update the master Booking as confirmed
```

The existing generic `ensureBookingConfirmed()` code currently marks a hotel booking confirmed once payment is paid. Change that behavior: for `bookingType === 'hotel'`, it must invoke a hotel confirmation orchestrator first. Otherwise the database can show a confirmed hotel that SRDV rejected.

Use an idempotency key and a distributed lock around step 7. If the payment gateway retries its callback, query the existing local/provider booking before sending another Book request.

## 8. Required HotelBooking persistence

Store an immutable booking snapshot, not live inventory:

```js
{
  userId,
  provider: 'srdv',
  status: 'awaiting_payment',
  searchId,
  traceId,
  srdvType,
  srdvIndex,
  resultIndex,
  srdvHotelId: hotelCode,
  srdvBookingId: null,
  bookingRefNo: null,
  confirmationNo: null,
  invoiceNumber: null,
  voucherStatus: null,
  hotelSnapshot: {},
  roomSnapshots: [],
  guests: [],
  priceSnapshot: {},
  cancellationPolicySnapshot: {},
  paymentId: null,
  providerRawResponse: {},
  failureReason: null
}
```

Suggested statuses:

```text
awaiting_payment -> payment_received -> confirming_provider
  -> confirmed
  -> provider_pending -> confirmed | provider_failed
  -> cancellation_requested -> cancelled
```

`hotelInventory.model.js` remains appropriate only for demo or contracted/local inventory. SRDV remains the source of live availability and price.

## 9. Project changes

1. Change `modules/hotels/hotel.routes.js` search from `GET /search` to `POST /search`; the current code validates and reads a request body.
2. Implement and export hotel functions in `providers/srdv/srdv.client.js`; they are currently missing.
3. Re-enable the SRDV adapter import in `modules/hotels/hotel.service.js`; it is currently commented out.
4. Split hotel mappings from the existing mixed flight adapter/client as the implementation grows.
5. Add endpoints for details, recheck, create pending booking, customer bookings, and cancellation.
6. Expand `HotelBooking` before enabling payments.
7. Modify payment success orchestration so hotel bookings are confirmed only after SRDV confirms/vouchers them.
8. Add mocked integration tests for price change, policy change, pending supplier booking, duplicate payment callback, Book failure after payment, and cancellation.

## 10. Items to verify in SRDV's Postman collection/sandbox

- Values permitted for `BookingMode` and `PreferredCurrency`.
- Exact payloads and paths for `HotelInfo`, `HotelRoom`, `BlockRoom`, `HotelBookingDetail`, and `HotelCancel`.
- Whether `IsVoucherBooking: false` creates a hold that later needs a separate voucher API call, and its expiry.
- How a voucher/document is retrieved or returned.
- Whether HotelBookingDetail supports a safe polling window and whether SRDV sends callbacks.
- Supplier cancellation quote, cancellation response, refund processing, and no-show behavior.
- Whether all `HotelRoomsDetails` fields must be echoed exactly from HotelRoom/BlockRoom results.
- Test and live credential/whitelist requirements for `EndUserIp`.

## Sources

- [SRDV Hotel Search v8](https://www.srdvtechnologies.com/doc/hotel/v8/search)
- [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)
- [SRDV Hotel API Postman collection](https://documenter.getpostman.com/view/27850097/2sB2j1iCbF)
- [SRDV live endpoint FAQ](https://www.srdvtechnologies.com/faq/api/common-query/what-are-the-endpoint-urls-for-the-flight-hotel-bus-and-car-live-apis)
