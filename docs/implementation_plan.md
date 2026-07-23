# Hotel Production Architecture — Full Implementation Plan (v2)

## Decision Summary

| Decision | Choice |
|---|---|
| Redis | ✅ Wire ioredis → `127.0.0.1:6379` |
| Queue | ✅ Install BullMQ, implement workers |
| Pricing Engine | ✅ `.env` markup placeholder only (skip full PricingRule collection for now) |
| Mock Data | ✅ **DELETE** mock provider — SRDV credentials available |
| HOTEL_PROVIDER | Change from `mock` → `srdv` |

---

## What I Will Do — Step by Step

---

### ✅ PHASE 1 — Install Dependencies
```
npm install ioredis bullmq
```
Two packages added to `package.json`. No other changes in this step.

---

### ✅ PHASE 2 — Redis & Cache Infrastructure

**NEW** → `utils/redis.js`
- Singleton `ioredis` client connecting to `127.0.0.1:6379`
- Auto-reconnect on disconnect
- Exported as `null` only if `REDIS_URL` is explicitly disabled (not the case here)
- Health-check method used by workers on startup

**NEW** → `utils/cache.js`  *(replaces the broken `chache.js`)*
- Same interface as old `chache.js`: `get(key)`, `set(key, value, ttlMs)`
- Two new methods:
  - `del(key)` — for explicit eviction
  - `consume(key)` — atomic single-use (for recheck sessions: read then delete in one op)
- **Backed by Redis** (ioredis): keys stored with `PXEX` TTL
- Namespace prefixing: all hotel keys get `hotel:` prefix automatically

**MODIFY** → `utils/chache.js`
- Replace content with: `module.exports = require('./cache')` (backward compat, zero breakage for any other modules that import the old typo name)

---

### ✅ PHASE 3 — SRDV Hotel Client (Completely New — Separated from Flights)

The existing `providers/srdv/srdv.client.js` only has **flight** functions. Hotel has **no client at all**. I will create a dedicated hotel client.

**NEW** → `providers/hotels/srdv/srdv-hotel.client.js`
- Dedicated `axios` instance for `SRDV_API_BASE_HOTEL_URL`
  - Test URL: `https://hotel.srdvtest.com/v8/rest`
  - Live URL: `https://hotel.srdvapi.com/v8/rest`
- **No `X-API-Key` header** — SRDV Hotel v8 puts credentials in JSON body, not headers
- Credentials injected from env: `EndUserIp`, `ClientId`, `UserName`, `Password`
- Timeouts: 20s for Search/HotelInfo/HotelRoom, 30s for Book/Cancel
- All calls log `correlationId` (from `req.correlationId`)
- HTTP methods implemented:
  - `search(payload)` → `POST /Search`
  - `hotelInfo(payload)` → `POST /HotelInfo`
  - `hotelRoom(payload)` → `POST /HotelRoom`
  - `blockRoom(payload)` → `POST /BlockRoom`
  - `book(payload)` → `POST /Book`
  - `hotelBookingDetail(payload)` → `POST /HotelBookingDetail`
  - `hotelCancel(payload)` → `POST /HotelCancel`
- Error normalization: SRDV errors wrapped into `AppError` with operation context

**NEW** → `providers/hotels/srdv/srdv-hotel.mapper.js`
- `mapSearchRequest(criteria)` — maps Maqam public fields to SRDV payload; calculates `NoOfNights` server-side from checkIn/checkOut; never trusts client-sent night count
- `mapSearchResponse(srdvData, searchId)` — strips `TraceId`, `SrdvIndex`, `ResultIndex`, credentials from public response; returns safe hotel cards only
- `mapHotelRoomRequest(sessionData, hotelId)` — builds SRDV HotelRoom request from cached search session
- `mapBlockRoomRequest(sessionData, hotelId, selectedRooms)` — builds SRDV BlockRoom payload entirely from server-side cache
- `mapBookRequest(bookingDoc, recheckSnapshot)` — builds SRDV Book payload from immutable DB snapshot + recheck snapshot; never uses browser-supplied data
- `mapBookResponse(srdvData)` → `{ status, providerBookingId, bookingRefNo, confirmationNo, invoiceNumber, voucherStatus, isPriceChanged, isPolicyChanged }`
- `mapCancelResponse(srdvData)` → `{ status, cancellationReference, penalty }`

**MODIFY** → `providers/hotels/srdv/srdv-hotel.provider.js`
- Replace the 503 stub with a real provider that:
  - Calls `srdv-hotel.client.js` methods
  - Uses `srdv-hotel.mapper.js` to map requests/responses
  - Implements all 7 contract methods: `searchHotels`, `getHotelDetails`, `getHotelRooms`, `blockRoom`, `book`, `getBookingStatus`, `cancelBooking`
  - Handles SRDV-specific outcomes: `IsPriceChanged`, `IsCancellationPolicyChanged`, `HotelBookingStatus: Pending`

**MODIFY** → `providers/srdv/srdv.client.js`
- Fix incorrect hotel base URL (`hotel.srdv.com` → `hotel.srdvtest.com`)
- Remove `X-API-Key` header from hotel axios instance (per SRDV v8 docs)
- Keep all existing flight functions untouched

---

### ✅ PHASE 4 — Delete Mock Data

**DELETE** → `providers/hotels/mock/mock-hotel.data.js`
- Hardcoded hotel array with fake Makkah/Madinah hotels — removed

**DELETE** → `providers/hotels/mock/mock-hotel.provider.js`
- Mock provider using fake data — removed

**MODIFY** → `modules/hotels/hotel-provider.factory.js`
- Remove `mock` entry from provider map
- Set default provider to `srdv`
- Throw clear error if unknown provider specified

---

### ✅ PHASE 5 — Domain Constants & Models

**MODIFY** → `modules/hotels/hotel.constants.js`
Expand `HOTEL_BOOKING_STATUS` to match architecture state machine:
```
PAYMENT_PENDING → PAYMENT_RECEIVED → BOOKING_IN_PROGRESS
  → CONFIRMED
  → PROVIDER_PENDING → CONFIRMED | PROVIDER_FAILED
  → CANCEL_REQUESTED → CANCELLED → REFUND_PENDING → REFUNDED → COMPLETED
  → PAYMENT_FAILED
```
Also add:
- `BOOKING_QUEUE_NAME = 'hotel-book'`
- `POLL_QUEUE_NAME = 'hotel-poll-status'`
- `CANCEL_QUEUE_NAME = 'hotel-cancel'`

**MODIFY** → `modules/hotels/hotel.model.js`
Add fields:
- `nextActionAt` (Date, indexed) — for worker scheduling
- `supplierAmountMinor` (Number) — supplier price in paise
- `customerTotalMinor` (Number) — customer price in paise
- `markupMinor` (Number) — markup applied in paise
- `feeMinor` (Number) — convenience fee in paise
- `pricingVersion` (String) — which markup rule was applied
- `outboxPublished` (Boolean) — has outbox event been enqueued

**NEW** → `modules/hotels/domain/hotel-booking-event.model.js`
Append-only audit log:
- `bookingId`, `sequence`, `fromStatus`, `toStatus`, `actor`, `reason`, `correlationId`, `metadata`

**NEW** → `modules/hotels/domain/supplier-exchange.model.js`
Per-SRDV-call record (encrypted payload):
- `provider`, `operation`, `correlationId`, `idempotencyKey`, `httpStatus`, `normalizedOutcome`, `attemptNumber`, `requestedAt`, `respondedAt`, `durationMs`, `encryptedPayload`

**NEW** → `modules/hotels/domain/outbox-event.model.js`
Transactional outbox:
- `aggregateType`, `aggregateId`, `eventType`, `payload`, `status` (`pending`/`published`/`failed`), `nextAttemptAt`, `attempts`

**NEW** → `modules/hotels/domain/hotel-refund.model.js`
Explicit refund tracking:
- `bookingId`, `paymentId`, `gatewayRefundId`, `idempotencyKey`, `status`, `customerAmountMinor`, `currency`, `reason`, `supplierCancellationReference`

---

### ✅ PHASE 6 — Application Layer (Use Cases)

**NEW** → `modules/hotels/application/pricing.service.js`
`.env`-based markup (placeholder for future PricingRule DB):
```env
HOTEL_MARKUP_PERCENT=8        # e.g. 8% above supplier price
HOTEL_CONVENIENCE_FEE_INR=200 # flat convenience fee in INR
```
- `calculateSellingPrice(supplierAmountMinor, currency)` → `{ supplierAmountMinor, markupMinor, feeMinor, customerTotalMinor, pricingVersion }`
- All arithmetic in integer paise (no floating point)
- Returns version string like `env-v1` for audit

**NEW** → `modules/hotels/application/hotel-search.usecase.js`
- `searchHotels(criteria)` → calls SRDV Search via provider → stores full result in Redis → returns safe public cards with Maqam selling price
- `getHotelDetails({ searchId, hotelId })` → validates hotel belongs to search → calls SRDV HotelInfo + HotelRoom → returns room details with selling price
- `recheckRoom({ searchId, hotelId, selectedRooms })` → validates session → calls SRDV BlockRoom from cached supplier context → single-use `recheckId` stored in Redis → returns `recheckId` + selling quote

**NEW** → `modules/hotels/application/hotel-booking.usecase.js`
- `createBooking({ userId, recheckId, guests, idempotencyKey })`:
  1. Atomically `consume(recheckId)` from Redis (single-use)
  2. Find existing booking for idempotencyKey → return if found
  3. Create `HotelBooking` in `PAYMENT_PENDING` with full immutable snapshot
  4. Write `OutboxEvent` in same Mongoose session/transaction
  5. Return booking + payment creation signal
- `confirmAfterPayment({ bookingId, paymentId })`:
  - Changes status `PAYMENT_PENDING` → `PAYMENT_RECEIVED`
  - Enqueues `hotel-book` BullMQ job (deterministic ID: `hotel-book:{bookingId}`)
  - Does **NOT** call SRDV synchronously

**NEW** → `modules/hotels/application/hotel-cancel.usecase.js`
- `cancelBooking({ bookingId, userId })`:
  1. Ownership + status eligibility check
  2. Idempotency check
  3. Set `CANCEL_REQUESTED`
  4. Call SRDV HotelCancel via provider
  5. Calculate customer refund using pricing policy
  6. Create `Refund` record
  7. Set booking `CANCELLED`
  8. Enqueue gateway refund job

---

### ✅ PHASE 7 — BullMQ Workers

**NEW** → `workers/hotels/hotel-book.worker.js`
- Consumes `hotel-book` queue
- On each job:
  1. Acquire Redis lock `lock:hotel-book:{bookingId}`
  2. Load booking from DB → verify `PAYMENT_RECEIVED`
  3. Set `BOOKING_IN_PROGRESS`
  4. Build SRDV Book payload from immutable snapshot (no Redis/live data)
  5. Call SRDV Book
  6. Write `SupplierExchange` record
  7. Outcome routing:
     - Confirmed → set `CONFIRMED` + `BookingEvent` + notification job
     - Pending → set `PROVIDER_PENDING` + schedule poll job (5 min)
     - Price changed → set `PROVIDER_FAILED` + refund job + notify
     - Failed → set `PROVIDER_FAILED` + refund job + notify
     - Timeout → set `PROVIDER_PENDING` + query-before-retry poll job
  8. Release lock

**NEW** → `workers/hotels/hotel-poll-status.worker.js`
- Consumes `hotel-poll-status` queue
- Calls SRDV `HotelBookingDetail`
- Bounded retries: 5 min → 10 min → 20 min → 30 min → dead-letter → ops alert
- On confirmed → updates booking, triggers notification
- On terminal fail → triggers refund

**MODIFY** → `workers/hotel-booking-status.worker.js`
- Keep `reconcilePendingHotelBookings` for manual/scheduled reconciliation
- Wire to BullMQ scheduler when Redis is available

---

### ✅ PHASE 8 — API Layer Updates

**MODIFY** → `modules/hotels/hotel.constants.js`
- Full status enum (see Phase 5)

**MODIFY** → `modules/hotels/hotel.controller.js`
- Delegate to new use-case layer
- Pass `correlationId` from `req.correlationId` through to services
- Pass `idempotencyKey` from `Idempotency-Key` header to booking use case

**MODIFY** → `modules/hotels/hotel.validator.js`
- Remove `mockScenario` from validators entirely (mock is deleted)
- Add `Idempotency-Key` header validation on booking creation

**MODIFY** → `modules/hotels/hotel.routes.js`
- Add `idempotencyMiddleware` to `POST /bookings`

**MODIFY** → `modules/hotels/hotel-booking.service.js`
- Remove synchronous `confirmBookingAfterPayment` that calls SRDV directly
- Replace with thin `confirmAfterPayment` that delegates to `hotel-booking.usecase.js` (which enqueues BullMQ job)

**MODIFY** → `modules/hotels/hotel-search.service.js`
- Delegate to `hotel-search.usecase.js`

---

### ✅ PHASE 9 — `.env` Updates

Add to `.env`:
```env
# ─── SRDV Hotel ───────────────────────────────────────────
HOTEL_PROVIDER=srdv
SRDV_API_BASE_HOTEL_URL=https://hotel.srdvtest.com/v8/rest
SRDV_END_USER_IP=<your-server-public-ip>
SRDV_CLIENT_ID=<your-client-id>
SRDV_USERNAME=<your-username>
SRDV_PASSWORD=<your-password>

# ─── Redis ────────────────────────────────────────────────
REDIS_URL=redis://127.0.0.1:6379

# ─── Hotel Pricing (placeholder until PricingRule DB) ─────
HOTEL_MARKUP_PERCENT=8
HOTEL_CONVENIENCE_FEE_INR=200
```

> [!CAUTION]
> **You must supply your actual SRDV `ClientId`, `UserName`, `Password`, and `EndUserIp` for the `.env` file.** I will add placeholder keys and you fill in the values — I won't expose credentials in code. Please share them in chat and I'll insert them directly into `.env`.

---

### ✅ PHASE 10 — Docs Fix

**MODIFY** → `docs/HOTEL_TOUR_PAYPAL_BOOKING_GUIDE.md`
- Fix 4× MD024 duplicate heading warnings (lines 244, 277, 291, 338)
- Rename to unique section headings

---

## Final Folder Structure After All Changes

```text
modules/hotels/
  hotel.constants.js          ← expanded status enum + queue names
  hotel.model.js              ← expanded schema (minor units, pricing version)
  hotel.routes.js             ← + idempotency middleware on POST /bookings
  hotel.controller.js         ← delegates to use-cases
  hotel.validator.js          ← no mockScenario, + Idempotency-Key header
  hotel-provider.factory.js   ← default=srdv, mock entry removed
  hotel-booking.service.js    ← thin facade, no sync SRDV call
  hotel-search.service.js     ← thin facade delegating to use-case
  domain/
    hotel-booking-event.model.js    [NEW]
    supplier-exchange.model.js      [NEW]
    outbox-event.model.js           [NEW]
    hotel-refund.model.js           [NEW]
  application/
    hotel-search.usecase.js         [NEW]
    hotel-booking.usecase.js        [NEW]  ← OutboxEvent + BullMQ enqueue
    hotel-cancel.usecase.js         [NEW]
    pricing.service.js              [NEW]  ← .env markup placeholder

providers/hotels/
  contracts/hotel-provider.contract.js   ← unchanged
  mock/
    mock-hotel.data.js               ← ❌ DELETED
    mock-hotel.provider.js           ← ❌ DELETED
  srdv/
    srdv-hotel.provider.js           ← real SRDV adapter (was 503 stub)
    srdv-hotel.client.js             [NEW] dedicated HTTP client
    srdv-hotel.mapper.js             [NEW] request/response mapping

workers/
  hotel-booking-status.worker.js     ← wired to BullMQ
  hotels/
    hotel-book.worker.js             [NEW]  ← main booking worker
    hotel-poll-status.worker.js      [NEW]  ← pending booking poller

utils/
  cache.js                           [NEW]  ← Redis-backed + in-memory fallback
  chache.js                          ← re-exports cache.js (backward compat)
  redis.js                           [NEW]  ← singleton ioredis client

.env                                 ← SRDV + Redis + pricing vars added
.env.example                         ← updated template
```

---

## What I Will NOT Change

| Item | Reason |
|---|---|
| `modules/payments/` | Payment layer is already well-structured |
| `providers/srdv/srdv.client.js` flight functions | Flight module untouched |
| `modules/auth/`, `modules/flights/`, etc. | Out of scope |
| `workers/hotel-booking-status.worker.js` reconcile logic | Kept + enhanced |
| All other modules | Untouched |

---

## ⚠️ Action Needed Before Execution

> [!IMPORTANT]
> Please **paste your SRDV credentials** in chat so I can add them to `.env`:
> - `SRDV_CLIENT_ID` = ?
> - `SRDV_USERNAME` = ?
> - `SRDV_PASSWORD` = ?
> - `SRDV_END_USER_IP` = your server's public IP
> - Are you using **sandbox** (`hotel.srdvtest.com`) or **live** (`hotel.srdvapi.com`)?

Once you share them, I'll start executing all phases immediately.
