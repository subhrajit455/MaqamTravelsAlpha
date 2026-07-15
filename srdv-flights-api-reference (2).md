# SRDV Flights API — Request Reference

> Source: Verified against actual SRDV JSON request examples.
> Use this when writing srdv.adapter.js — not the SRDV docs directly (docs have errors).

---

## How the steps connect

```
Search → FareQuote → Book (TicketLCC or Hold GDS) → TicketGDS (GDS only, after payment)
```

`TraceId`, `SrdvIndex`, `ResultIndex`, `SrdvType` — come from Search, must be stored on FlightBooking immediately, echoed in every subsequent request.

---

## Credentials — srdv.client.js adds these to every request

```js
{
  EndUserIp: process.env.SRDV_END_USER_IP,
  ClientId:  process.env.SRDV_CLIENT_ID,
  UserName:  process.env.SRDV_USERNAME,
  Password:  process.env.SRDV_PASSWORD
}
```

---

## 1. Search — OneWay

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "AdultCount": 1,
  "ChildCount": 0,
  "InfantCount": 0,
  "JourneyType": 1,
  "DirectFlight": false,
  "Segments": [
    {
      "Origin": "BOM",
      "Destination": "DXB",
      "FlightCabinClass": 0,
      "PreferredDepartureTime": "2025-12-25T00:00:00",
      "PreferredArrivalTime": "2025-12-25T00:00:00"
    }
  ]
}
```

## 1b. Search — Return

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "AdultCount": 1,
  "ChildCount": 0,
  "InfantCount": 0,
  "JourneyType": 2,
  "DirectFlight": false,
  "Segments": [
    {
      "Origin": "BOM",
      "Destination": "BLR",
      "FlightCabinClass": 0,
      "PreferredDepartureTime": "2025-12-29T00:00:00",
      "PreferredArrivalTime": "2025-12-29T00:00:00"
    },
    {
      "Origin": "BLR",
      "Destination": "BOM",
      "FlightCabinClass": 0,
      "PreferredDepartureTime": "2025-12-31T00:00:00",
      "PreferredArrivalTime": "2025-12-31T00:00:00"
    }
  ]
}
```

**JourneyType:** 1=OneWay, 2=Return, 3=MultiCity
**FlightCabinClass:** 0=No preference, 2=Economy, 3=PremiumEconomy, 4=Business, 5=PremiumBusiness, 6=First
> ⚠️ Docs say 1=All but actual requests use 0 for no cabin preference. Use 0.

---

## 2. FareQuote

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "SrdvType": "MixAPI",
  "TraceId": "174278",
  "SrdvIndex": "2",
  "ResultIndex": "5-5668111542_36DELAMD6E2501AMDBOM6E6794~36270019929212"
}
```

**What you get back — check these before proceeding:**
- `IsPriceChanged: true` → return new price to frontend, do NOT book
- `IsTimeChanged: true` → return new time to frontend, do NOT book
- `IsGSTMandatory: true` → pull GST values from Settings and fill GST fields
- `Fare: {}` → save this entire object, send it back in the book request as-is

---

## 3. TicketLCC (LCC airlines — IndiGo, SpiceJet etc.)

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "SrdvType": "MixAPI",
  "SrdvIndex": "2",
  "TraceId": "174278",
  "ResultIndex": "5-5668111542_36DELAMD6E2501AMDBOM6E6794~36270019929212",
  "Passengers": [
    {
      "Title": "Mr",
      "FirstName": "First",
      "LastName": "Name",
      "PaxType": 1,
      "DateOfBirth": "",
      "Gender": "1",

      "PassportNo": "",
      "PassportExpiry": "",
      "PassportIssueDate": "",

      "AddressLine1": "A152 Ashok Nagar",
      "City": "Delhi",
      "CountryCode": "IN",
      "CountryName": "INDIA",
      "CellCountryCode": "+91",
      "ContactNo": "1234567890",
      "Email": "john@example.com",

      "IsLeadPax": 1,

      "GSTCompanyAddress": "",
      "GSTCompanyContactNumber": "",
      "GSTCompanyName": "",
      "GSTNumber": "",
      "GSTCompanyEmail": "",

      "Fare": {
        "BaseFare": 3691,
        "Tax": 1465,
        "TransactionFee": "0",
        "YQTax": 700,
        "AdditionalTxnFeeOfrd": "",
        "AdditionalTxnFeePub": "",
        "AirTransFee": "0"
      },

      "Baggage": [],
      "MealDynamic": [],
      "Seat": []
    }
  ]
}
```

> ⚠️ `IsLeadPax` is integer `1`, NOT boolean `true`
> ⚠️ `Fare` is an object `{}`, NOT an array `[]`
> ⚠️ LCC Fare does NOT have `Currency` or `OtherCharges` — GDS does

### Baggage[] — MVP sends []. When built, each item:
```json
{
  "WayType": 1,
  "Code": "XBPESeKey309",
  "Description": "Excess Baggage - 3 Kg",
  "Weight": "Excess Baggage - 3 Kg",
  "Currency": "INR",
  "Price": 1350,
  "Origin": "DEL",
  "Destination": "AMD"
}
```
> `Origin`/`Destination` here = which flight segment this baggage applies to, NOT the overall trip

### MealDynamic[] — MVP sends []. When built, each item:
```json
{
  "WayType": 1,
  "Code": "TCSWSeKey309",
  "Description": "Tomato Cucumber Cheese Lettuce Sandwich Combo",
  "AirlineDescription": "Tomato Cucumber Cheese Lettuce Sandwich Combo",
  "Quantity": "1",
  "Currency": "INR",
  "Price": 400,
  "Origin": "DEL",
  "Destination": "AMD"
}
```

### Seat[] — MVP sends []. When built, each item:
```json
{
  "AirlineCode": "6E",
  "FlightNumber": "2501",
  "SeatNumber": "4C",
  "IsBooked": false,
  "IsLegroom": false,
  "IsAisle": true,
  "Amount": 350,
  "Code": "4CSeKey309",
  "Origin": "DEL",
  "Destination": "AMD"
}
```
> ⚠️ Field is `FlightNumber` NOT `AirlineNumber` — SRDV docs are wrong on this

---

## 4. Hold GDS (GDS airlines — Air India, Emirates etc.)

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "SrdvType": "MixAPI",
  "SrdvIndex": "1",
  "TraceId": "204142",
  "ResultIndex": "OB3_0_2",
  "Passengers": [
    {
      "Title": "Mr",
      "FirstName": "Jojy",
      "LastName": "Milson",
      "PaxType": 1,
      "DateOfBirth": "1997-03-12T00:00:00",
      "Gender": "1",

      "PassportNo": "abc123456",
      "PassportExpiry": "2031-03-12T00:00:00",

      "AddressLine1": "Noida, Sector 63",
      "City": "Noida",
      "CountryCode": "IN",
      "CountryName": "INDIA",
      "ContactNo": "1234567890",
      "Email": "email@gmail.com",

      "IsLeadPax": 1,

      "GSTCompanyAddress": "",
      "GSTCompanyContactNumber": "",
      "GSTCompanyName": "",
      "GSTNumber": "",
      "GSTCompanyEmail": "",

      "Fare": {
        "Currency": "INR",
        "BaseFare": 3180,
        "Tax": 9364,
        "YQTax": 0,
        "OtherCharges": 0,
        "TransactionFee": "0",
        "AdditionalTxnFeeOfrd": 0,
        "AdditionalTxnFeePub": 0,
        "AirTransFee": "0"
      }
    }
  ]
}
```

**Differences from LCC:**

| Field | LCC | GDS |
|-------|-----|-----|
| CellCountryCode | ✅ Send it | ❌ Do not send |
| PassportIssueDate | ✅ Send it (even if empty string) | ❌ Do not send |
| Baggage[] | ✅ Send (empty array for MVP) | ❌ Do not send at all |
| MealDynamic[] | ✅ Send (empty array for MVP) | ❌ Do not send at all |
| Seat[] | ✅ Send (empty array for MVP) | ❌ Do not send at all |
| Fare.Currency | ❌ Not present | ✅ Required |
| Fare.OtherCharges | ❌ Not present | ✅ Required |

---

## 5. TicketGDS (called internally after payment — not a customer route)

```json
{
  "EndUserIp": "1.1.1.1",
  "ClientId": "...",
  "UserName": "...",
  "Password": "...",
  "SrdvType": "MixAPI",
  "SrdvIndex": "1",
  "TraceId": "204142",
  "ResultIndex": "OB3_0_2",
  "PNR": "ABC123",
  "BookingId": 9876543
}
```

All values from FlightBooking record in DB.

---

## Traveller model → SRDV field mapping

```js
// srdv.adapter.js
const paxTypeMap = { Adult: 1, Child: 2, Infant: 3 };
const genderMap  = { Male: "1", Female: "2" };

function buildPassenger(traveller, isLeadPax, fareFromFareQuote, isLCC) {
  const passenger = {
    Title:       traveller.title,
    FirstName:   traveller.firstName,
    LastName:    traveller.lastName,
    PaxType:     paxTypeMap[traveller.passengerType],
    DateOfBirth: formatDate(traveller.dateOfBirth) || "",
    Gender:      genderMap[traveller.gender],

    PassportNo:     traveller.passportNo || "",
    PassportExpiry: formatDate(traveller.passportExpiry) || "",

    AddressLine1: (traveller.addressLine1 || "").slice(0, 32),
    City:         traveller.city,
    CountryCode:  traveller.countryCode,
    CountryName:  traveller.countryName,
    ContactNo:    traveller.phone,
    Email:        traveller.email,

    IsLeadPax: isLeadPax ? 1 : 0,   // integer, not boolean

    GSTCompanyAddress:       gst.address || "",
    GSTCompanyContactNumber: gst.contactNumber || "",
    GSTCompanyName:          gst.companyName || "",
    GSTNumber:               gst.gstNumber || "",
    GSTCompanyEmail:         gst.email || "",

    Fare: fareFromFareQuote,   // object from FareQuote response
  };

  if (isLCC) {
    passenger.CellCountryCode   = traveller.cellCountryCode;
    passenger.PassportIssueDate = formatDate(traveller.passportIssueDate) || "";
    passenger.Baggage     = [];
    passenger.MealDynamic = [];
    passenger.Seat        = [];
  }

  return passenger;
}
```

---

## Fields NOT on Traveller model

| Field | Source |
|-------|--------|
| IsLeadPax | Frontend sends which travellerId is lead in /book request |
| PaxType (1/2/3) | Mapped from traveller.passengerType in adapter |
| Gender ("1"/"2") | Mapped from traveller.gender in adapter |
| Fare object | FareQuote response — pass through as-is |
| Baggage/Meal/Seat items | Post-MVP — customer selects at booking time |
| GST fields | Settings collection — only if IsGSTMandatory = true from FareQuote |
