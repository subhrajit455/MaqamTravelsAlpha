# Flight Booking — Data Flow

> Companion to `srdv-flights-api-reference.md` (exact field shapes). This file: what crosses
> each boundary (Frontend ↔ Backend ↔ SRDV), what the backend caches/stores, what it never
> trusts from the frontend.

```
Customer  <──>  Backend  <──>  SRDV
                   ^v
              Payment Gateway
```

**Rule used throughout:** frontend only ever sends `traceId` + `resultIndex(es)` (+ raw pax
input at Book). Anything that *decides* which SRDV call gets made (`srdvIndex`, `isLCC`,
`singleSlotBooking`, `fareType`, fare amounts) is looked up server-side from a cache keyed by
`traceId`, never taken from the request body.

---

## 1. Search

**FE → BE** `POST /flights/search`
```json
{ origin, destination, departureDate, returnDate?, journeyType, paxCount }
```

**BE → SRDV** — same fields + credentials, `CabinClass` forced to `0`, `JourneyType` 1/2.

**SRDV → BE**
```
TraceId, SrdvType                                  // top-level
Results[0]  = outbound options                     // Results[1] = inbound, return only
  FareDataMultiple[]: { ResultIndex, SrdvIndex, IsLCC, SingleSlotBooking, FareType, OfferedFare }
```

**BE caches** (Redis, or in-memory `Map` for now — TTL ~10–15 min), keyed by `traceId`:
```js
{
  srdvType,
  outbound: [{ resultIndex, srdvIndex, isLCC, singleSlotBooking, fareType, returnIdentifierMatched, offeredFare }],
  inbound:  [...]   // only when SRDV returned separate onward/return fare sets
}
```
Coerce before math: `YQTax`, `TransactionFee` can be strings; `IsGSTMandatory` can be `"Not Set"`.

**BE → FE**
```json
{ traceId, outbound: [{ resultIndex, totalAmount, airline, segments }], inbound: [...] }
```
`srdvIndex` / `isLCC` / `singleSlotBooking` are **not** sent to the frontend.

---

## 2. Fare Rule *(optional, informational — doesn't gate anything downstream)*

**FE → BE** `{ traceId, resultIndex }` → **BE → SRDV** (looks up `srdvIndex` from cache) → **BE → FE** rules text.

---

## 3. FareQuote

**FE → BE** `POST /flights/farequote`
```json
{ traceId, resultIndex }              // one-way, or single-index return
{ traceId, resultIndex: [ob, ib] }    // two-index return — one per leg selected
```

**BE looks up cache** by `traceId`, matches entry(ies) by `resultIndex`, reads
`srdvIndex, isLCC, singleSlotBooking, fareType, returnIdentifierMatched`.

**BE branches:**

| Case | SRDV calls |
|---|---|
| 1 `resultIndex` | one `FareQuote(ResultIndex)` |
| 2 `resultIndex`, `singleSlotBooking = "Yes"` | one `FareQuote(ResultIndex: "OB,IB")` — or, if `fareType = "SpecialReturn"` and `returnIdentifierMatched` has a value, use that value for both OB and IB |
| 2 `resultIndex`, `singleSlotBooking = "No"` | two independent `FareQuote` calls, one per index |

**BE → SRDV** `{ SrdvType, TraceId, SrdvIndex, ResultIndex }` (per call above)

**SRDV → BE**
```
IsPriceChanged, IsTimeChanged
Results.Fare, Results.IsGSTMandatory, Results.IsLCC
Results.IsPassportRequiredAtBook / FullDetail / ExpiryRequired / IssueDateRequired
Results.AdultDobRequired / ChildDobRequired / InfantDobRequired
Results.HoldAllowed, Results.SeatSelectAllowed
```

**BE:** if `IsPriceChanged || IsTimeChanged` → stop, nothing booked yet, return new price to FE.
Else store `Fare` snapshot server-side (cache, keyed same as above) — never send raw `Fare` to FE.

**BE → FE**
```json
{
  confirmedFare, isGstMandatory,
  required: { passport, passportFullDetail, passportExpiry, passportIssueDate, adultDob, childDob, infantDob, hold, seatSelect }
}
```
(2-leg `"No"` case → this shape once per leg)

---

## 4. Book — `TicketLCC` (isLCC = true) or `HoldGDS` (isLCC = false)

**FE → BE** `POST /flights/book` — same shape either way, frontend never needs to know which branch:
```json
{
  "traceId": "174278",
  "resultIndex": "5-5668111542_36DELAMD6E2501AMDBOM6E6794~36270019929212",
  "passengers": [{ "title": "Mr", "firstName": "First", "lastName": "Name", "gender": "1", "dateOfBirth": "",
    "passportNo": "", "passportExpiry": "", "passportIssueDate": "", "addressLine1": "A152 Ashok Nagar",
    "city": "Delhi", "countryCode": "IN", "countryName": "INDIA", "cellCountryCode": "+91",
    "contactNo": "1234567890", "email": "john@example.com", "isLeadPax": true }],
  "gstDetails": null
}
```

**BE looks up** (server-side — never from this request): `srdvIndex`, `isLCC`, `srdvType`, and the
`fareSnapshot` stored at FareQuote (§3). `buildPassenger()` combines raw pax input + server-held
`Fare`, branching internally on `isLCC` to shape the two payloads below.

---

### isLCC = true → `TicketLCC`

**BE → SRDV**
```json
{
  "SrdvType": "MixAPI", "TraceId": "174278", "SrdvIndex": "2",
  "ResultIndex": "5-5668111542_36DELAMD6E2501AMDBOM6E6794~36270019929212",
  "Passengers": [{
    "Title": "Mr", "FirstName": "First", "LastName": "Name", "PaxType": 1, "Gender": "1", "DateOfBirth": "",
    "PassportNo": "", "PassportExpiry": "", "PassportIssueDate": "",
    "AddressLine1": "A152 Ashok Nagar", "City": "Delhi", "CountryCode": "IN", "CountryName": "INDIA",
    "CellCountryCode": "+91", "ContactNo": "1234567890", "Email": "john@example.com", "IsLeadPax": 1,
    "GSTCompanyAddress": "", "GSTCompanyContactNumber": "", "GSTCompanyName": "", "GSTNumber": "", "GSTCompanyEmail": "",
    "Fare": { "BaseFare": 3691, "Tax": 1465, "TransactionFee": "0", "YQTax": 700, "AdditionalTxnFeeOfrd": "", "AdditionalTxnFeePub": "", "AirTransFee": "0" },
    "Baggage": [], "MealDynamic": [], "Seat": []
  }]
}
```
`Fare` = the FareQuote snapshot as-is, no `Currency`/`OtherCharges`. `IsLeadPax` is `1`, not `true`.

**SRDV → BE**
```json
{
  "PNR": "XXXXXX", "BookingId": 123456,
  "IsPriceChanged": false, "IsTimeChanged": false,
  "TicketStatus": 1,
  "FlightItinerary": { "InvoiceNo": "INV123", "InvoiceStatus": "Generated" },
  "Passenger": [{ "Ticket": { "TicketNumber": "", "IssueDate": "" } }]
}
```
`Ticket` fields can be empty here — not a bug, filled in later by `flight_callback` (§7).

**BE stores** `{ pnr, srdvBookingId, ticketStatus, invoiceNo, status: "confirmed" }`.
`IsPriceChanged`/`IsTimeChanged` true → the ticket is already real, nothing to undo — log + flag only.

---

### isLCC = false → `HoldGDS`

**BE → SRDV**
```json
{
  "SrdvType": "MixAPI", "TraceId": "174278", "SrdvIndex": "2",
  "ResultIndex": "5-3656635733_1BOMFJR6E1501~...",
  "Passengers": [{
    "Title": "Mr", "FirstName": "First", "LastName": "Name", "PaxType": 1, "Gender": "1", "DateOfBirth": "",
    "PassportNo": "", "PassportExpiry": "",
    "AddressLine1": "A152 Ashok Nagar", "City": "Delhi", "CountryCode": "IN", "CountryName": "INDIA",
    "ContactNo": "1234567890", "Email": "john@example.com", "IsLeadPax": 1,
    "GSTCompanyAddress": "", "GSTCompanyContactNumber": "", "GSTCompanyName": "", "GSTNumber": "", "GSTCompanyEmail": "",
    "Fare": { "Currency": "INR", "BaseFare": 2758, "Tax": 2400.59, "YQTax": 0, "OtherCharges": 0, "TransactionFee": 0, "AdditionalTxnFeeOfrd": 0, "AdditionalTxnFeePub": 0, "AirTransFee": 0 }
  }]
}
```
No `CellCountryCode`, `PassportIssueDate`, `Baggage[]`/`MealDynamic[]`/`Seat[]` — GDS doesn't take
them. `Fare` requires `Currency`/`OtherCharges`, which LCC's doesn't have.

**SRDV → BE**
```json
{
  "PNR": "XXXXXX", "BookingId": 123457,
  "IsPriceChanged": false, "IsTimeChanged": false,
  "FlightItinerary": { "LastTicketDate": "2026-07-10T23:59:00" }
}
```
No `TicketStatus`/`InvoiceNo` yet — nothing's ticketed, the seat is only held.

**BE stores** `{ pnr, srdvBookingId, lastTicketDate, status: "pending" }`.
Stays `pending` until §6 (`TicketGDS`, after payment) actually issues the ticket.

---

### Both paths, from here

**BE:** creates `FlightBooking` doc with `status: "initiated"` *before* calling SRDV (crash-safety
net), then updates it with whichever block above applies, right after.

**One `FlightBooking` document per real SRDV booking**, decided by the FareQuote branch (§3):
- 1 index, or 2-index `"Yes"` → **one** document (one `PNR`/`BookingId` either way — unverified for the combined-index case, test before relying on it).
- 2-index `"No"` → **two linked** documents (own `orderId` field ties them together for the FE order view). No schema change to `resultIndex` needed either way — stays `String`.

**BE:** create Razorpay order.

**BE → FE** `{ bookingId, razorpayOrderId, amount }` — same shape for both paths.

---

## 5. Payment

**FE**: opens gateway checkout with `razorpayOrderId`. No SRDV involvement.

**Gateway → BE** signed webhook `POST /payments/webhook`. Verify signature server-side — never
trust a frontend "payment succeeded" flag.

- GDS → triggers §6.
- LCC → ticket already exists; this just settles what's owed.

---

## 6. Ticket (`TicketGDS`) — GDS only, after verified payment

**BE → SRDV** `{ SrdvType, TraceId, SrdvIndex, ResultIndex, PNR, BookingId }` — all from the `FlightBooking` doc, not the frontend.
Check `lastTicketDate` first — expired hold is its own failure case.

**SRDV → BE** `TicketStatus, FlightItinerary.{InvoiceNo, InvoiceStatus}, Passenger[].{ticketNumber, issueDate, ticketId, status}`

**BE:** `status → confirmed`, store ticket fields, trigger confirmation email/SMS.

---

## 7. `flight_callback` — async status push

Registered by you in SRDV's dashboard (Settings → Callback URL) — not given to you by SRDV.
Fires only when a Book/Ticket response came back `Pending`/`In Process`/`On Hold` and later
resolves to `Success`/`Failed`/`Aborted`.

**SRDV → BE** `POST <your URL>` `{ ClientId, UserName, Password, BookingId, PNR, Status, TicketNumber?, ... }`

**BE:**
```
1. ClientId/UserName/Password must match stored creds → reject otherwise (only auth SRDV gives you)
2. FlightBooking.findOne({ srdvBookingId: BookingId })
3. Update: pnr, status (map Success/Failed/Aborted), passenger ticketNumbers (match by name)
4. Failed/Aborted → trigger refund
5. Respond { Error: { ErrorCode: 0 } }
```
Idempotent on `BookingId` — SRDV may redeliver. Needs a tunnel (ngrok) for local testing.

---

## 8. `FlightBooking` schema

```js
{
  user: ObjectId,
  orderId: String,                                // links 2 docs for the SingleSlotBooking "No" case
  traceId, srdvType, srdvIndex, resultIndex: String, isLCC: Boolean,
  fareSnapshot: Mixed, totalAmount, markupAmount: Number,
  isGstMandatory: Boolean, gstDetails: Mixed,

  pnr, gdsPnr: String,
  srdvBookingId: { type: Number, index: true },   // join key for TicketGDS + callback
  lastTicketDate: Date,                            // GDS only
  status: { enum: ["initiated","pending","confirmed","failed","aborted"], default: "initiated" },
  ticketStatus, invoiceNo, invoiceStatus, remark: String,
  passengers: [{ travellerId, isLeadPax, paxId, ticketNumber, ticketId, ticketIssueDate, ticketStatus }],
  razorpayOrderId, razorpayPaymentId: String,
}
```

---

## Status mapping

| `status` | SRDV Book/Hold | SRDV callback | Payment |
|---|---|---|---|
| `initiated` | not called yet | — | — |
| `pending` | Hold ok, no ticket | Pending / In Process / On Hold | created |
| `confirmed` | `TicketStatus: 1` or post-`TicketGDS` | Success | verified |
| `failed` | — | Failed | — |
| `aborted` | — | Aborted | refunded |

---

## Open decisions

- [ ] Confirm `"Yes"` combined-index Book returns one `PNR` (assumed, untested)
- [ ] `orderId` linking for the `"No"` two-document case — not yet on schema
- [ ] Multi-pax-type fare (`FareBreakdown[]` per `PaxType`) — unconfirmed
- [ ] GST field UI — only when `isGstMandatory`
- [ ] Cancellation / Send Change Request — undesigned
- [ ] Callback signature/security — confirm no auth beyond re-sent credentials

## Build order

1. Search caching layer (Redis/Map, keyed by `traceId`)
2. FareQuote — single-index path first
3. Book — branch `isLCC`, log-not-block on price/time change, create doc pre-call
4. Payment webhook — signature check, branch GDS/LCC
5. `TicketGDS`, respecting `lastTicketDate`
6. `flight_callback` — credential-checked, idempotent
7. Confirmation email/SMS
8. Two-index return branch, cancellations, GST UI, multi-pax fare split
