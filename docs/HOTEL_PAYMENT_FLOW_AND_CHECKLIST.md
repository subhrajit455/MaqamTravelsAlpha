# Hotel Data and Payment Flow — Full Codebase Guide

This document explains how hotel-related data and payment flows are implemented in the repository, what is currently supported, and how to verify hotel booking data end-to-end.

## 1. Repo areas involved in hotel flow

### Hotel search / details

- `modules/hotels/hotel.routes.js`
- `modules/hotels/hotel.controller.js`
- `modules/hotels/hotel.service.js`
- `modules/hotels/hotel.model.js`
- `modules/hotels/hotel.validator.js`

### Hotel booking data model

- `modules/hotels/hotel.model.js`
- `modules/payments/bookingResolver.js`
- `modules/payments/payment.validator.js`
- `modules/payments/payment.routes.js`
- `modules/payments/payment.model.js`

### Payment gateways that support hotel bookings

- `modules/payments/gateways/paypal/paypal.controller.js`
- `modules/payments/gateways/paypal/paypal.service.js`
- `modules/payments/gateways/paypal/paypal.adapter.js`
- `modules/payments/gateways/paypal/paypal.client.js`
- `modules/payments/gateways/paypal/paypal.webhook.js`
- `modules/payments/gateways/phonepe/phonepe.service.js`
- `modules/payments/gateways/razorpay/razorpay.service.js`

### Test data and booking generation

- `scripts/create-test-bookings.js`

## 2. What the hotel model stores

`modules/hotels/hotel.model.js` defines the hotel booking document in MongoDB.
It stores:

- `userId` — reference to authenticated user
- `srdvHotelId` — external hotel inventory ID
- `hotelName`, `destination`, `checkIn`, `checkOut`
- `roomType`, `pricePerNight`, `totalNights`, `totalPrice`, `currency`
- `status` — `pending`, `confirmed`, `cancelled`, `completed`
- `srdvBookingRef`, guest contact fields, special requests, cancellation policy
- `paymentId` — linked to the `Payment` document after payment succeeds

This model does not itself host inventory data. Inventory comes from SRDV provider responses.

## 3. Hotel search flow

The hotel module currently supports two endpoints:

### Search hotels

- `GET /api/v1/hotels/search`
- Validates: `destination`, `checkIn`, `checkOut`, `guests`
- Calls `hotelService.searchHotels()`
- `hotelService` forwards to `providers/srdv/srdv.adapter`

### Hotel details

- `GET /api/v1/hotels/:hotelId`
- Validates: `hotelId`
- Fetches details through `hotelService.getHotelDetails()`

## 4. Hotel booking creation status

There is no complete hotel booking creation endpoint in `modules/hotels` yet.

The bookings flow is split:

- `modules/bookings/booking.routes.js` provides generic booking CRUD
- `modules/bookings/booking.service.js` has TODOs for hotel/flight orchestration

So currently the safest way to test hotel booking data is via the test generator script.

## 5. How hotel payments are supported

The payment system supports `bookingType: hotel` by mapping it to `HotelBooking`.
That mapping is defined in `modules/payments/payment.constants.js`:

```js
const BOOKING_MODEL_MAP = {
  flight: "FlightBooking",
  hotel: "HotelBooking",
  tour: "Tour",
  package: "Package",
};
```

The booking resolver in `modules/payments/bookingResolver.js` loads hotel bookings like this:

- `Model.findById(bookingId)` for `HotelBooking`
- populates `userId` to normalize ownership checks

## 6. Payment endpoints for hotel bookings

Hotel booking payments use the same API contract as other booking types.

### Create PayPal order

- `POST /api/v1/payments/paypal/create-order`
- Required body:
  ```json
  {
    "bookingId": "<hotel_booking_mongo_id>",
    "bookingType": "hotel"
  }
  ```
- Requires `Idempotency-Key` header
- Authenticated request only
- Returns `redirectUrl` to PayPal approval page

### Capture PayPal order

- `POST /api/v1/payments/paypal/capture`
- Required body:
  ```json
  {
    "orderId": "<paypal_order_id>"
  }
  ```
- Requires `Idempotency-Key` header
- Authenticated request only

### Payment status

- `GET /api/v1/payments/paypal/:paymentId`
- Authenticated request only

## 7. PayPal hotel order details and validation

`modules/payments/gateways/paypal/paypal.service.js` performs:

- booking ownership check
- prevents duplicate paid bookings
- reuses active pending payments
- converts `INR` to `USD` for PayPal checkout
- creates the PayPal order and saves `Payment` document

When hotel booking currency is `INR`, the app converts it before PayPal order creation:

- `paymentCurrency = 'USD'`
- `paymentAmount = nativeAmount * PAYPAL_CONVERSION_RATE`

Then the PayPal adapter sends:

- `intent: 'CAPTURE'`
- `purchase_units[0].amount.currency_code`
- `application_context.return_url`
- `application_context.cancel_url`

## 8. Hotel payment test data

A ready-made hotel booking exists in `scripts/create-test-bookings.js`.
Run that script to seed a hotel booking record for testing.

Example hotel booking created by the script:

- `hotelName: 'Test Hotel Mumbai'`
- `destination: 'Mumbai'`
- `checkIn: 2024-12-25`
- `checkOut: 2024-12-27`
- `roomType: 'Deluxe'`
- `pricePerNight: 15000`
- `totalPrice: 30000`
- `currency: 'INR'`
- `status: 'pending'`
- `guestName: 'John Customer'`
- `guestEmail: 'customer@example.com'`
- `guestPhone: '8294507785'`

The script logs the generated `HotelBooking ID` once created.

## 9. How to verify hotel booking data in the codebase

### Step 1: Inspect the hotel booking record

Use the generated `HotelBooking ID` and query MongoDB directly or via your frontend.

### Step 2: Verify the test hotel booking structure

Confirm fields in the record:

- `hotelName`
- `destination`
- `checkIn`, `checkOut`
- `pricePerNight`, `totalNights`, `totalPrice`
- `currency` and `status`
- `guestName`, `guestEmail`, `guestPhone`

### Step 3: Verify the payment booking resolver supports hotel

Open `modules/payments/bookingResolver.js` and confirm that `hotel` resolves to `HotelBooking`.

### Step 4: Verify PayPal create-order logic

Open `modules/payments/gateways/paypal/paypal.service.js` and ensure:

- it calls `resolveBooking(bookingId, bookingType)`
- it converts `INR` to `USD`
- it saves `gatewayData.orderId` and `gatewayData.raw`

### Step 5: Verify PayPal capture logic

Open `modules/payments/gateways/paypal/paypal.service.js` and confirm:

- capture uses `paypalClient.orders.capture(orderId, orderId)`
- it updates payment status to `paid`
- it links booking status to `confirmed`

### Step 6: Verify webhook support

Open `modules/payments/gateways/paypal/paypal.webhook.js` and confirm it:

- verifies PayPal webhook signature
- processes `PAYMENT.CAPTURE.COMPLETED`
- finds payment by `gatewayData.orderId`
- calls `captureAndVerifyPayment()` for idempotent update

## 10. Quick test flow for hotel booking payments

1. Seed hotel booking data:
   ```bash
   node scripts/create-test-bookings.js
   ```
2. Note the `HotelBooking ID` printed.
3. Authenticate as the test user.
4. Create PayPal order:
   ```bash
   curl -X POST http://localhost:5000/api/v1/payments/paypal/create-order \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -H "Idempotency-Key: hotel-paypal-order-001" \
     -d '{"bookingId":"<HotelBooking ID>","bookingType":"hotel"}'
   ```
5. Open `redirectUrl` from the response.
6. Approve using a sandbox personal buyer account.
7. Capture order:
   ```bash
   curl -X POST http://localhost:5000/api/v1/payments/paypal/capture \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -H "Idempotency-Key: hotel-paypal-capture-001" \
     -d '{"orderId":"<paypal_order_id>"}'
   ```
8. Confirm payment status:
   ```bash
   curl -X GET http://localhost:5000/api/v1/payments/paypal/<paymentId> \
     -H "Authorization: Bearer <token>"
   ```

## 11. Notes and current limitations

- `modules/hotels/hotel.routes.js` currently only supports search and details; hotel booking creation is not fully implemented there.
- The booking orchestrator and hotel booking persistence are partially TODO in `modules/bookings/booking.service.js`.
- The safest existing path for hotel testing is the seeded `HotelBooking` document from `scripts/create-test-bookings.js`.

## 12. Recommended next checks in the full codebase

1. `app.js` to confirm route mounting:
   - `/api/v1/hotels`
   - `/api/v1/payments`
   - `/webhook/paypal`
2. `payment.routes.js` to confirm PayPal `create-order` and `capture` are authenticated with idempotency.
3. `payment.validator.js` to confirm `bookingType: hotel` is allowed.
4. `payment.model.js` to confirm `bookingModel: HotelBooking` is valid.
5. `scripts/create-test-bookings.js` to confirm hotel test data structure and sample booking ID.

---

This file is intended to be the repository-level guide for hotel booking data and hotel payment verification. It explains where hotel data lives, how payment order creation works, and how to test the full hotel/payment flow in the current codebase.
