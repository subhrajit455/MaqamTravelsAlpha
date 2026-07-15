# Travel Platform — Project Handoff

## What We Are Building
A full-stack MERN travel booking platform with:
- Hotel booking
- Flight booking
- Custom tour planner
- Role-based admin dashboard
- CRM module (prefix-gated)
- Admin package system (bulk inventory)

---

## Tech Stack
- **Frontend:** React (two apps — customer site + admin dashboard)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Caching:** Redis (planned)
- **Auth:** JWT + Refresh Tokens
- **Third-party APIs:** SRDV Technologies Travel API (for hotels + flights)
- **Payments:** Razorpay, PhonePe, PayPal
- **Notifications:** SendGrid, Twilio, WhatsApp (planned)

---

## Folder Structure (Module-based — already implemented)
```
server/
  modules/
    auth/
      auth.routes.js
      auth.controller.js
      auth.service.js
      auth.model.js         ← User model lives here
      auth.validator.js
    hotels/
      hotel.routes.js
      hotel.controller.js
      hotel.service.js      ← calls srdv.adapter.js for search
      hotel.model.js        ← stores booking references, NOT full inventory
      hotel.validator.js
    flights/
      (same pattern as hotels)
    bookings/
      booking.routes.js
      booking.controller.js
      booking.service.js
      booking.model.js
      booking.validator.js
    tours/
      tour.routes.js
      tour.controller.js
      tour.service.js
      tour.model.js
      tour.validator.js
    packages/
      package.routes.js
      package.controller.js
      package.service.js
      package.model.js
      package.validator.js
    payments/
      payment.routes.js
      payment.controller.js
      payment.service.js
      payment.model.js
      payment.validator.js
    account/
      account.routes.js
      account.controller.js
      account.service.js
      account.validator.js
    cms/
      cms.routes.js
      cms.controller.js
      cms.service.js
      cms.model.js          ← Page, BlogPost, Banner, Testimonial
      cms.validator.js
    crm/
      crm.routes.js         ← prefix-gated, admin phase
      crm.controller.js
      crm.service.js
      crm.model.js
      crm.validator.js
  providers/
    srdv/
      srdv.client.js        ← raw HTTP calls to SRDV API
      srdv.adapter.js       ← normalises SRDV response to our internal shape
  config/
    db.js
    constants.js
  middleware/
    auth.middleware.js
    rbac.middleware.js
    rateLimiter.js
    errorHandler.js
    validate.js
  utils/
    logger.js
    apiResponse.js
  jobs/
  server.js
  package.json
  .env.example
```

---

## Module Pattern (every module follows this)
- **routes** — endpoint definitions only, applies validators + middleware
- **controller** — thin, handles req/res, calls service
- **service** — all business logic, talks to DB and external APIs
- **model** — Mongoose schema only
- **validator** — express-validator chains for that module

---

## Key Decisions Made

### CRM is prefix-gated
- CRM only accessible via a secret URL prefix
- Set via `CRM_PREFIX` in `.env` (e.g. `/ops-crm`)
- Mounted in `server.js` as `/api/v1${CRM_PREFIX}`
- Even if URL is guessed, still requires staff role to access
- CRM is an admin-phase feature — not being built yet

### SRDV Adapter Pattern
- Never call SRDV directly from controllers or services
- All SRDV calls go through `providers/srdv/srdv.client.js`
- `srdv.adapter.js` normalises the response into our internal shape
- If SRDV changes their API, only the adapter changes
- Hotel and flight **models** store booking references only — not full inventory (that comes from SRDV)
- SRDV documentation not received yet — hotels and flights modules will be mocked until then

### Admin Package System
- Admins can buy hotel rooms / flights in bulk and create packages
- Packages have: `cost_price`, `sell_price`, `inventory_count`, `allocated_count`, `sold_count`
- Agents can sell packages, customers can buy them
- Inventory decrements on every booking, rejects if sold out

### Standard API Response Shape
Every endpoint returns:
```json
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": {}
}
```
Handled via `utils/apiResponse.js` helpers:
`sendSuccess`, `sendError`, `sendCreated`, `sendNotFound`,
`sendUnauthorized`, `sendForbidden`, `sendBadRequest`, `sendPaginated`

### Error Handling
- Global error handler in `middleware/errorHandler.js`
- Custom `AppError` class — throw anywhere: `throw new AppError('Not found', 404)`
- Handles: Mongoose validation, duplicate keys, bad ObjectIds, JWT errors
- `express-async-errors` installed — no need to wrap async route handlers in try/catch

---

## Roles (defined in config/constants.js)
```
customer
sales_agent
support_agent
finance
admin
super_admin
```

## All Status Constants (in config/constants.js)
- **BOOKING_STATUS:** pending, confirmed, cancelled, completed, failed
- **PAYMENT_STATUS:** pending, paid, failed, refunded
- **TOUR_STATUS:** draft, submitted, reviewing, quoted, accepted, booked, cancelled
- **LEAD_STATUS:** new, contacted, interested, quoted, converted, lost, nurture
- **TICKET_STATUS:** open, in_progress, resolved, closed

---

## Rate Limiting (middleware/rateLimiter.js)
- **apiLimiter** — 100 requests / 15 min (all routes)
- **authLimiter** — 10 requests / 15 min (login/register)
- **searchLimiter** — 30 requests / 1 min (SRDV search routes)

---

## Environment Variables (.env.example)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/travel-platform
JWT_SECRET=
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
CRM_PREFIX=/ops-crm
SRDV_BASE_URL=
SRDV_API_KEY=
SRDV_AGENT_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
REDIS_URL=redis://localhost:6379
```

---

## Dependencies (package.json)
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-async-errors": "^3.1.1",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.4.1",
    "morgan": "^1.10.0",
    "winston": "^3.13.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.3"
  }
}
```

---

## What Is Built So Far
- [x] Module folder structure
- [x] server.js (entry point, all middleware wired)
- [x] config/db.js (MongoDB connection)
- [x] config/constants.js (all roles + statuses)
- [x] middleware/errorHandler.js + AppError class
- [x] middleware/rateLimiter.js
- [x] middleware/validate.js
- [x] utils/logger.js (Winston)
- [x] utils/apiResponse.js
- [x] .env.example
- [x] Stub route files for all modules (so server doesn't crash)

## What Needs To Be Built Next (in order)
- [ ] Auth module — User model, register, login, JWT + refresh token, logout
- [ ] RBAC middleware — role guard, ownership guard
- [ ] Hotel module — search, details, booking (mocked until SRDV docs arrive)
- [ ] Flight module — same pattern
- [ ] Bookings module — create, view, cancel
- [ ] Custom tour planner module
- [ ] Payments module (stubbed gateway calls)
- [ ] Account module (my bookings, saved itineraries, invoices, tickets)
- [ ] CMS module (pages, blog, banners, testimonials)
- [ ] SRDV adapter (when docs arrive)
- [ ] CRM module (admin phase — after user side is complete)
- [ ] Admin package system (admin phase)

---

## Open Questions (not yet decided)
- Partial payments / installments for bookings?
- Auto-assign leads to agents or manual by admin?
- Can packages be publicly listed or agent-sell only?
- GST invoice generation required from day one?
- Passport/ID required for flight bookings?
- Deployment target (AWS / DigitalOcean / VPS)?
- International payments (PayPal) at launch or phase 2?

---

## Customer-Facing Pages (from product doc)
```
Home
  Banner Slider, Featured Tours, Popular Destinations, Testimonials
Hotel Booking
  Search, Filter (Price/Rating/Amenities), Details, Availability Calendar, Checkout
Flight Booking
  Search, Filter (Airline/Price/Stops), Details, Checkout
Custom Tour Planner
  Create Plan, Select Destination, Add Activities/Hotels/Transport, Preview, Submit
User Account
  Login/Register, My Bookings, Saved Itineraries, Payments & Invoices, Support Tickets
Static Pages
  About Us, Contact, Blog
```

## Admin Dashboard Pages (from product doc)
```
Dashboard (KPIs — bookings, revenue, active users, lead conversion)
Booking Management (hotel, flight, custom tours, payment status)
Hotel Management (add/edit hotels, rooms/pricing, availability, partners)
Flight Management (API config, rules)
Tour Planner (manage plans, approve/modify, assign agents)
Customer Management (profiles, booking history, support logs)
CRM (leads, customer profiles, quotes/invoices, tickets, comms log)
Reports (sales, agent performance, monthly/quarterly export)
CMS Management (pages, blog, banners)
Settings (roles/permissions, payment gateway, API keys)
```
