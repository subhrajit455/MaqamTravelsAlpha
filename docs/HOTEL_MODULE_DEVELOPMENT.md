# Hotel Module Development

The hotel module is provider-based. Without SRDV sandbox credentials, run it with:

```env
HOTEL_PROVIDER=mock
```

The public workflow is:

```text
POST /hotels/search
GET  /hotels/:hotelId?searchId=...
POST /hotels/recheck
POST /hotels/bookings (authenticated)
payment verified -> supplier Book
POST /hotels/bookings/:id/cancel (authenticated)
```

`searchId` and `recheckId` are opaque server-side cache keys. The browser must not send supplier credentials, trace IDs, or supplier booking payloads.

The mock provider supports `mockScenario` on search/recheck for local development: `price_changed`, `policy_changed`, `provider_pending`, and `book_failure`. Do not expose this field in a production client.

Before enabling `HOTEL_PROVIDER=srdv`, validate SRDV's precise HotelInfo, HotelRoom, BlockRoom, HotelBookingDetail, and HotelCancel paths and payloads with its supplied Postman collection. A paid hotel booking becomes confirmed only when the supplier returns a confirmed/voucher result.

`workers/hotel-booking-status.worker.js` is intentionally not scheduled yet. Enable it through the application's queue/scheduler only after SRDV confirms its polling interval and pending-booking rules.
