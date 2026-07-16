# SRDV Hotel Booking and Settlement Flow

> For the complete production architecture, clean-layer responsibilities, Redis/BullMQ design, data model, state machine, accounting model, security controls, and Mermaid diagrams, see [Production Hotel Booking Architecture](/modules/hotel-booking-architecture). This document remains the concise SRDV settlement companion.

> Status: design specification for Maqam Travels. Reviewed against SRDV's public Hotel v8 Book documentation on 2026-07-14. Validate every supplier request/response with SRDV's Postman collection and sandbox before enabling the SRDV provider.

## 1. The important distinction: two money flows, one customer checkout

There must **not** be two payment pages for the customer.

```text
Customer  -- customer selling price -->  Maqam payment gateway / bank account
Maqam     -- supplier net amount ------> SRDV agent wallet, credit line, invoice, or deposit account
```

The customer pays **Maqam once**. SRDV is Maqam's supplier; Maqam settles SRDV separately under its commercial agreement. SRDV's published `Book` payload contains booking, room, passenger, supplier-price, and credential fields, but no customer card or gateway-payment field. Therefore SRDV settlement must not be modelled as a second frontend checkout. [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)

The exact SRDV settlement mechanism is commercial-account specific. Before going live, ask SRDV whether the account uses a prepaid wallet, credit limit, postpaid invoice, or another method, and how an insufficient balance is reported.

## 2. Three separate financial records

Do not store all amounts in one `totalPrice` field. Every hotel booking needs these independent records.

| Record | Meaning | Typical source |
| --- | --- | --- |
| Customer charge | Amount Maqam asks the customer to pay | Recheck supplier amount + Maqam markup/fee/discount/tax rules |
| Supplier payable | Amount SRDV deducts or invoices to Maqam | Rechecked SRDV `OfferedPrice`/supplier amount; verify exact payable field with SRDV |
| Maqam revenue | Customer charge minus supplier payable, gateway fees, refunds, and taxes | Calculated by Maqam accounting |

Example only:

```text
SRDV rechecked supplier amount: INR 10,000
Maqam markup:                   INR    800
Gateway/convenience fee:        INR    200
Customer pays Maqam:            INR 11,000

Maqam settles SRDV:             INR 10,000
Maqam gross margin before costs: INR 1,000
```

Never send Maqam markup, convenience fee, payment-gateway identifiers, or customer card details to SRDV unless SRDV has explicitly documented a field for it.

## 3. Ownership and trust boundary

```text
Browser
  sends: destination, dates, rooms, guests, selected room ID, approval
  never sends: SRDV credentials, TraceId, SrdvIndex, raw rate objects, Book payload

Maqam API
  owns: searchId, recheckId, amount calculation, payment order, booking state,
        idempotency, supplier call, customer notification, accounting records

SRDV
  owns: live inventory, supplier price, cancellation policy, supplier booking state,
        confirmation/voucher result, supplier cancellation result
```

## 4. End-to-end customer booking flow

### Step 0 — Obtain SRDV setup before enabling it

Obtain sandbox credentials, a whitelisted `EndUserIp`, the official Postman collection, permitted `BookingMode` values, accepted currencies, and the exact `HotelInfo`, `HotelRoom`, `BlockRoom`, `HotelBookingDetail`, and cancellation contracts. Use the test base URL first. Do not enable live access merely by changing an environment variable.

### Step 1 — Search availability

1. Customer enters city, country, check-in, check-out, nationality, and one guest definition per room.
2. Maqam validates dates and child ages, calculates `NoOfNights`, and sends the SRDV Search request.
3. SRDV returns results plus supplier correlation fields such as `TraceId`, `SrdvType`, `SrdvIndex`, `ResultIndex`, and hotel/room price data.
4. Maqam creates an opaque UUID `searchId`, caches the complete supplier result for 10–15 minutes, and returns only normalized safe hotel data to the browser.

```text
Customer -> Maqam POST /hotels/search -> SRDV Search
Customer <- Maqam { searchId, hotels[] }
```

`searchId` is Maqam's own server-side key. It is not an SRDV field and must expire. The browser must provide it for later details and recheck calls, but it must never receive supplier credentials.

### Step 2 — Details and room selection

1. Customer opens a hotel.
2. Maqam confirms that the hotel belongs to the cached `searchId`.
3. Maqam calls `HotelInfo`/`HotelRoom` if required by the verified SRDV contract.
4. Customer selects the room/rate and enters every required guest detail.

Save the original supplier room object only on the server. SRDV's published Book contract requires a large amount of selected room data, including rate plan, daily rates, price elements, amenities, cancellation policies, and passenger information. Reconstructing that payload in the browser is unsafe and error-prone. [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)

### Step 3 — BlockRoom: the final revalidation boundary

Immediately before creating a payment order:

1. Browser sends Maqam `searchId`, hotel ID, and selected internal room IDs.
2. Maqam retrieves the cached supplier context and calls SRDV `BlockRoom`.
3. Maqam compares the rechecked amount and cancellation policy with the last customer-approved values.
4. Maqam creates a short-lived immutable `recheckId` snapshot.

```text
Customer -> Maqam POST /hotels/recheck -> SRDV BlockRoom
Customer <- Maqam { recheckId, customerTotal, supplierTotal, policy, priceChanged, policyChanged }
```

If price or policy changed, stop here. Display the new amount/policy and require explicit customer approval. Do not create a payment order from the original Search price. SRDV itself recommends BlockRoom before Book because Book can otherwise fail due to updated price/policy. [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)

### Step 4 — Create the local booking and payment order

After the customer accepts the latest recheck snapshot:

1. Create `HotelBooking` with status `awaiting_payment`.
2. Persist immutable hotel, selected rooms, guests, supplier amount, Maqam pricing breakdown, cancellation policy, `searchId`, `recheckId`, and SRDV correlation data.
3. Calculate the customer charge only on the server from the stored recheck snapshot.
4. Create the Maqam payment-gateway order for that exact customer charge.
5. Return the gateway order/token to the browser.

The `recheckId` must be single-use for booking creation. A duplicate click should return the existing local booking, not create another booking or another supplier call.

### Step 5 — Customer pays Maqam

1. Customer completes payment on Razorpay, PhonePe, PayPal, or the selected gateway.
2. Maqam receives the gateway callback/webhook.
3. Maqam verifies signature, amount, currency, gateway order ID, and payment status server-side.
4. Maqam marks the payment record paid and moves the hotel booking to `payment_received`.

At this point, the customer has paid Maqam. The hotel is **not yet confirmed**.

### Step 6 — Maqam books with SRDV

1. Acquire a distributed lock for `hotel-book:{bookingId}`.
2. Use an idempotency key and check whether a previous supplier request already produced a booking reference.
3. Build the SRDV Book request only from the stored recheck snapshot and stored guest data.
4. Call SRDV `Book` with the supplier-required `TraceId`, `SrdvType`, `SrdvIndex`, `ResultIndex`, room details, passengers, credentials, and `EndUserIp`.
5. Prefer `IsVoucherBooking: true` only after SRDV confirms this is the right business mode. SRDV documents `true` as direct voucher/booking and `false` as hold-now/voucher-later; the later voucher endpoint/expiry must be verified before using a hold. [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)

### Step 7 — Handle the SRDV Book response

| SRDV result | Maqam booking status | Customer communication | Financial action |
| --- | --- | --- | --- |
| Confirmed / voucher successful | `confirmed` | Send confirmation, voucher/invoice if available | Record supplier payable; settle SRDV under account terms |
| Pending | `provider_pending` | Tell customer confirmation is pending; do not promise a voucher | Keep payment recorded; poll supplier status |
| `IsPriceChanged` / `IsCancellationPolicyChanged` | `provider_failed` or `requires_customer_reapproval` | Show revised terms; do not claim confirmed | Do not auto-charge a price difference; refund/void original payment or collect a separately approved difference |
| Book failure | `provider_failed` | Inform customer booking was not confirmed | Start refund/void/recovery workflow |
| Unknown timeout | `confirming_provider` | Tell customer processing is in progress | Query SRDV booking detail before any retry; never blindly send Book again |

SRDV states that Book can return changed price/policy and that the client must compare the result and send a new Book request after accepting updated terms. It can also return `Pending`, for which SRDV directs clients to query `HotelBookingDetail` after a few minutes (5–10). [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)

## 5. Recommended status state machine

```text
awaiting_payment
  -> payment_received
  -> confirming_provider
     -> confirmed
     -> provider_pending -> confirmed | provider_failed
     -> provider_failed

confirmed
  -> cancellation_requested
  -> cancelled
```

Do not use `confirmed` to mean "payment received". It means SRDV has returned a successful confirmed/vouchered supplier result.

## 6. Supplier settlement: Maqam to SRDV

Supplier settlement is separate from the API booking state.

### Prepaid wallet / deposit account

If SRDV deducts booking value from Maqam's wallet, Book may fail when wallet balance is insufficient. Monitor balance, keep a reserve, and reconcile each SRDV `BookingId` to wallet transactions.

### Credit line / postpaid invoice

If SRDV grants credit, Book may create a supplier payable. Reconcile SRDV invoice/statement lines against Maqam confirmed bookings using `BookingId`, `BookingRefNo`, `InvoiceNumber`, and booking date.

### Accounting rule

Customer payment and supplier settlement must use different ledger entries:

```text
Customer payment: gateway receivable/clearing -> Maqam cash/bank
Supplier booking: Maqam cost/payable -> SRDV payable or wallet deduction
Customer refund:  Maqam refund payable -> gateway/customer
Supplier refund:  SRDV receivable/wallet credit -> supplier recovery
```


The supplier's cancellation refund and the customer refund are not necessarily the same amount or date. Maqam must first obtain the final SRDV cancellation result, then apply the customer-facing cancellation policy and any legal/contractual rules.

## 7. Cancellation flow

```text
Customer cancellation request
  -> Maqam validates ownership and booking status
  -> SRDV cancellation quote/HotelCancel (exact contract must be verified)
  -> store supplier charge/refund result
  -> calculate customer refund
  -> initiate gateway refund when approved
  -> update booking: cancelled or cancellation_requested/pending
```

Never assume that a cancellation is free merely because the Maqam database has a policy text. SRDV is the final live supplier source for cancellation eligibility and cost.

## 8. Failure and recovery rules

| Failure point | Required action |
| --- | --- |
| Search/recheck cache expired | Require a new search/recheck; never reuse stale supplier selections |
| Gateway webhook duplicated | Verify idempotency key; do not call SRDV Book twice |
| Payment paid, SRDV timeout | Keep `confirming_provider`; query booking detail/reconcile before retrying |
| Payment paid, SRDV rejects booking | Mark `provider_failed`; void/refund under the defined recovery SLA |
| SRDV pending | Poll only at the supplier-approved interval; do not mark confirmed before a confirmed result |
| SRDV cancellation succeeds but refund is delayed | Keep supplier-refund state separate from customer-refund state |
| Amount mismatch in callback | Reject/flag payment; never Book based on an unverified amount |

## 9. Data required on HotelBooking

```js
{
  userId,
  provider: 'srdv',
  status,
  searchId,
  recheckId,
  traceId,
  srdvType,
  srdvIndex,
  resultIndex,
  srdvHotelId,
  hotelSnapshot,
  roomSnapshots,
  guests,
  supplierPriceSnapshot,
  customerPriceSnapshot,
  cancellationPolicySnapshot,
  paymentId,
  providerBookingId,
  bookingRefNo,
  confirmationNo,
  invoiceNumber,
  voucherStatus,
  providerRawResponse,
  failureReason,
  cancellationReference
}
```
Keep raw supplier response access restricted to admins/support. Do not expose credentials or full raw supplier payloads in customer APIs.

## 10. Before SRDV production launch

- Validate exact request/response JSON for Search, HotelInfo, HotelRoom, BlockRoom, Book, HotelBookingDetail, and HotelCancel.
- Confirm whether `BlockRoom` creates a supplier hold and its expiry; do not assume it does.
- Confirm `IsVoucherBooking` behaviour, hold expiry, and any later voucher endpoint.
- Confirm SRDV settlement model, wallet/credit checks, invoices, and reconciliation reports.
- Confirm cancellation quote, cancellation result, supplier refund timing, and no-show treatment.
- Confirm all required guest fields, including whether all passenger details are mandatory per room.
- Test confirmed, pending, price changed, policy changed, supplier failure, timeout, duplicate webhook, and cancellation/refund paths in sandbox.
- Add Redis for search/recheck sessions and a durable job queue for pending booking polling before scaling beyond one API process.

## 11. Current Maqam implementation versus live SRDV requirements

The current implementation is intentionally **mock-first**. It proves the booking state flow but it does not yet represent real supplier settlement.

| Area | Current state | Required before `HOTEL_PROVIDER=srdv` |
| --- | --- | --- |
| Provider | Mock inventory and mock supplier outcomes | Implement the SRDV client and mapper only from verified sandbox payloads |
| Amounts | One mock `priceSnapshot` / `totalPrice` | Persist separate `supplierPriceSnapshot`, `customerPriceSnapshot`, markup/fee/tax components, and settlement/reconciliation records |
| Payment | Payment flow can trigger the provider booking orchestrator | Create gateway order only after recheck; verify gateway callback amount/currency/signature; define refund recovery automation |
| Supplier settlement | Not implemented in mock mode | Integrate/report against SRDV wallet, credit, or invoice mechanism confirmed by SRDV |
| Cache | In-memory cache | Replace with Redis before multi-instance or production deployment |
| Pending status | Worker helper exists but is not scheduled | Add a durable queue/scheduler using SRDV-approved polling timing |

Do not switch `HOTEL_PROVIDER` to `srdv` until every item in the preceding production checklist has been completed and signed off.

## Sources

- [SRDV Hotel Book v8](https://www.srdvtechnologies.com/doc/hotel/v8/book)
- [SRDV Hotel API documentation root](https://www.srdvtechnologies.com/document/hotel/v8)
- [SRDV FAQ: Special and International city databases](https://www.srdvtechnologies.com/faq/hotel-api/hotel-common-query/how-to-use-special-and-international-hotel-city-database)
- [SRDV FAQ: BlockRoom nationality requirement](https://www.srdvtechnologies.com/faq/hotel-api/hotel-common-query/why-are-we-encountering-an-error-nationality-cannot-be-null-or-whitespace-in-the-hotel-blockroom-api-response)
