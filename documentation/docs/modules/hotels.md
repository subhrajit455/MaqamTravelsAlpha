---
sidebar_position: 3
---

# Hotels Module

The `hotels` module handles property listings, room inventories, live rates, availability checks, and reservations.

## Component Map

* **Routes:** `hotel.routes.js`
* **Controller:** `hotel.controller.js`
* **Service:** `hotel.service.js`
* **Model:** `Hotel` / `Room`

---

## Core Features

### 1. Catalog Search
* **Parameters:** Searches by latitude/longitude, destination city, check-in and check-out dates, and guest headcount.
* **Aggregator Sync:** Fetches details from local database entries (direct hotel contracts) and combines results with external hotel API providers (e.g. EPS / WebBeds).

### 2. Live Availability and Rate Check
* Room rates fluctuate dynamically. Before proceeding to the payment screen, the service verifies room inventory status directly with the provider, blocking the room temporarily for 10 minutes.

### 3. Hotel Reservation Lifecycle
1. **Hold Room:** Places room on a temporary hold in the hotel PMS.
2. **Execute Payment:** User completes checkout.
3. **Confirm Booking:** Sends confirmation code and receives voucher number from the hotel aggregator.
