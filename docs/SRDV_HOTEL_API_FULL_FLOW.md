# SRDV Hotel API Full Flow

> This document describes the Maqam public hotel flow and the internal SRDV provider contract from search through booking.
>
> Use this as the authoritative end-to-end test plan for the hotel module.

## 1. Public API flow

### 1.1 Search hotels

- Endpoint: `POST /api/v1/hotels/search`
- Auth: public
- Body: normalized hotel search criteria

```json
{
  "cityId": "725862",
  "countryCode": "IN",
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-03",
  "guestNationality": "IN",
  "currency": "INR",
  "rooms": [
    {
      "adults": 2,
      "children": 0,
      "childAges": []
    }
  ],
  "minRating": 3,
  "maxRating": 5
}
```

Response:

```json
{
  "success": true,
  "message": "Hotels found",
  "data": {
    "searchId": "c4a5cbda-1758-4fb3-8646-d93dfa020825",
    "expiresInSeconds": 900,
    "hotels": [
      {
        "id": "hsid4255550579-39676307",
        "name": "Hotel C Park Inn",
        "rating": 0,
        "address": "1042/15, Abdul Rahman Road, Naiwalan",
        "amenities": [],
        "imageUrls": [
          "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/54e2e5ec_z.jpg"
        ],
        "fromPrice": {
          "amountMinor": 884505,
          "currency": "INR"
        },
        "priceDisclosure": {
          "includesTaxes": true,
          "includesFees": true
        }
      }
    ]
  }
}
```

### 1.2 Get hotel details and room options

- Endpoint: `GET /api/v1/hotels/:hotelId?searchId={searchId}`
- Auth: public
- No body required

Example:

```http
GET /api/v1/hotels/hsid4255550579-39676307?searchId=c4a5cbda-1758-4fb3-8646-d93dfa020825
```

Response:

```json
{
  "success": true,
  "message": "Hotel details",
  "data": {
    "id": "hsid8789387822-39676307",
    "name": "Hotel C Park Inn",
    "rating": 0,
    "address": "",
    "description": "",
    "imageUrls": [
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/54e2e5ec_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/54e2e5ec_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w4290h2789x85y0-4f606ab2_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w8039h5338x159y46-48a85f8b_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/0668526d_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/f80b9244_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/05fce6e8_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/c6c3da75_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/a5828129_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/69eeb34a_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/9a8bf8a7_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/ef20744f_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/46488928_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/1c6c0404_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w6108h4066x0y214-e9c1efb0_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w6648h4409x0y0-bcb240fb_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w8135h5411x0y0-3630b22f_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w5180h3885x5y0-af098296_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/6cb48f75_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w4143h2506x293y11-cbc61a5c_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/8a238f3f_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w6088h4087x0y0-f2c30084_z.jpg",
      "https://i.travelapi.com/lodging/3000000/2660000/2658500/2658482/w5599h3767x0y0-aa8e9408_z.jpg"
    ],
    "currency": "INR",
    "rooms": [
      {
        "id": "8205fc1b-de0d-473c-aeed-d1d5ae7ebe11srlktsrlkthsid8789387822srlktsrlkt48cab9778a5c0c30ff1722ddb6f53e63",
        "name": "Deluxe Room",
        "board": "No meals included",
        "capacity": 2,
        "price": 4522.53,
        "totalPrice": 4522.53,
        "currency": "INR",
        "refundable": false,
        "cancellationPolicy": "Standard cancellation policy applies.",
        "srdvRoomDetails": {
          "CategoryName": "Deluxe Room",
          "Rooms": [
            {
              "ChildCount": 0,
              "RequireAllPaxDetails": false,
              "RoomId": "10024808851_0",
              "RoomStatus": "Active",
              "RoomIndex": "8205fc1b-de0d-473c-aeed-d1d5ae7ebe11srlktsrlkthsid8789387822srlktsrlkt48cab9778a5c0c30ff1722ddb6f53e63",
              "RoomTypeCode": "8205fc1b-de0d-473c-aeed-d1d5ae7ebe11__hsid8789387822__48cab9778a5c0c30ff1722ddb6f53e63",
              "RoomTypeName": "Deluxe Room",
              "Price": {
                "CurrencyCode": "INR",
                "RoomPrice": 4002.34,
                "PublishedPrice": 4002.34,
                "OfferedPrice": 4002.34
              },
              "CancellationPolicies": [
                {
                  "Charge": 0,
                  "ChargeType": 1,
                  "Currency": "INR",
                  "FromDate": "2026-07-17T08:13",
                  "ToDate": "2026-07-30T23:59"
                }
              ]
            }
          ],
          "OfferedPrice": 4002.34
        },
        "priceSnapshot": {
          "supplierAmountMinor": 400234,
          "markupMinor": 32019,
          "feeMinor": 20000,
          "customerTotalMinor": 452253,
          "currency": "INR",
          "pricingVersion": "env-p8-f200-v1"
        }
      }
    ]
  }
}
```

## 2. Recheck before booking

- Endpoint: `POST /api/v1/hotels/recheck`
- Auth: public
- Body:

```json
{
  "searchId": "c4a5cbda-1758-4fb3-8646-d93dfa020825",
  "hotelId": "hsid4255550579-39676307",
  "selectedRooms": [
    {
      "roomId": "8205fc1b-de0d-473c-aeed-d1d5ae7ebe11srlktsrlkthsid8789387822srlktsrlkt48cab9778a5c0c30ff1722ddb6f53e63",
      "quantity": 1
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Hotel room rechecked",
  "data": {
    "recheckId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "expiresInSeconds": 600,
    "priceChanged": false,
    "policyChanged": false,
    "hotel": {
      "id": "hsid4255550579-39676307",
      "name": "Hotel C Park Inn",
      "rating": 0,
      "address": "1042/15, Abdul Rahman Road, Naiwalan"
    },
    "roomSnapshots": [ ... ],
    "price": {
      "currency": "INR",
      "total": 4522.53
    },
    "cancellationPolicy": [
      "Standard cancellation policy applies."
    ]
  }
}
```

## 3. Create hotel booking

- Endpoint: `POST /api/v1/hotels/bookings`
- Auth: required
- Headers:
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <unique-string>`

Body:

```json
{
  "recheckId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "acceptChanges": true,
  "guests": [
    {
      "title": "Mr",
      "firstName": "MD Rana",
      "lastName": "HASAN",
      "type": "adult",
      "email": "example@gmail.com",
      "phone": "1234567899"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "message": "Hotel booking is awaiting payment",
  "data": {
    "id": "64d7e3a8f1d2f2b4c7a8b123",
    "status": "PAYMENT_PENDING",
    "providerBookingId": null,
    "bookingRefNo": null,
    "paymentStatus": "PENDING",
    "amountMinor": 452253,
    "currency": "INR",
    "expiresInSeconds": 900
  }
}
```

## 4. Bookings and cancellation

- Get user bookings: `GET /api/v1/hotels/bookings/me`
- Get a booking: `GET /api/v1/hotels/bookings/:id`
- Cancel booking: `POST /api/v1/hotels/bookings/:id/cancel`

## 5. Internal SRDV flow

1. `Search` → `POST {SRDV_API_BASE_HOTEL_URL}/Search`
2. `GetHotelInfo` → `POST {SRDV_API_BASE_HOTEL_URL}/GetHotelInfo`
3. `GetHotelRoom` → `POST {SRDV_API_BASE_HOTEL_URL}/GetHotelRoom`
4. `BlockRoom` → `POST {SRDV_API_BASE_HOTEL_URL}/BlockRoom`
5. `Book` → `POST {SRDV_API_BASE_HOTEL_URL}/Book`
6. If needed, poll `HotelBookingDetail`
7. `HotelCancel` → `POST {SRDV_API_BASE_HOTEL_URL}/HotelCancel`

## 6. Test plan

- Search with valid cityId, dates and room guests.
- Fetch hotel details using `searchId` and selected `hotelId`.
- Recheck selected room(s) and verify unchanged price/policy.
- Create booking with authenticated user and idempotency header.
- Verify payment flow is created and booking remains pending until provider confirmation.
- Confirm booking retrieval returns stored booking.
- Cancel booking and verify cancellation response.

## 7. Swagger coverage

The following Swagger schemas are added in `swagger/components/schemas/hotels.yaml`:

- `HotelSearchRequest`
- `HotelSearchResponse`
- `HotelCard`
- `HotelDetailsResponse`
- `HotelRoom`
- `HotelRecheckRequest`
- `HotelRecheckResponse`
- `HotelBookingCreateRequest`
- `HotelBookingResponse`
- `HotelBookingSummary`
- `HotelCancelResponse`
