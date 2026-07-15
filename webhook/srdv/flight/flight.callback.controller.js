// modules/flights/flight.callback.controller.js
//
// Handles POST <your-registered-URL> — SRDV's flight_callback webhook
// (srdv-flights-api-reference.md §6, flight-booking-flow.md §7). Direction is reversed
// from every other SRDV interaction in this codebase: SRDV calls YOU here. You register
// this URL yourself in SRDV's Dashboard → Settings → Callback URL — it isn't handed to
// you by SRDV, and it can't reach localhost, so local testing needs ngrok or similar.
//
// SECURITY NOTE (flagged in srdv-flights-api-reference.md §6, not resolved — carried
// forward here as-is): SRDV re-sends ClientId/UserName/Password in the callback body as
// the ONLY verification mechanism — no signature, no HMAC, no documented IP allowlist.
// Anyone holding those credentials (already sent on every outbound call) could forge a
// callback. This handler enforces the credential check because it's the only guard
// documented, but it is not a strong guarantee on its own. Worth asking SRDV directly
// whether a real signing mechanism exists that didn't make it into this reference doc —
// the doc's own header warns "SRDV docs have errors."
//
// ASSUMPTION (flagged, unconfirmed): always returning HTTP 200 with the Error object
// carrying the real outcome, since the doc only defines a body-level `{ Error: {...} }`
// contract and never states what HTTP status SRDV expects or how it reacts to a non-2xx.
// If SRDV actually gates retry behavior on HTTP status rather than ErrorCode, this needs
// to change to return a non-200 on failure instead.

const flightCallbackService = require("./flight.callback.service");
const logger = require("../../utils/logger"); // adjust path

const SRDV_CLIENT_ID = process.env.SRDV_CLIENT_ID;
const SRDV_USERNAME = process.env.SRDV_USERNAME;
const SRDV_PASSWORD = process.env.SRDV_PASSWORD;

function credentialsMatch(body) {
  // ClientId may arrive as a number or a numeric string depending on SRDV's serializer —
  // coerce both sides to string rather than assuming a type.
  return (
    String(body.ClientId) === String(SRDV_CLIENT_ID) &&
    body.UserName === SRDV_USERNAME &&
    body.Password === SRDV_PASSWORD
  );
}

const handleFlightCallback = async (req, res) => {
  const body = req.body;

  if (!credentialsMatch(body)) {
    logger.warn("flight_callback: credential mismatch — possible spoofed callback", {
      bookingId: body?.BookingId,
    });
    return res.status(200).json({
      Error: { ErrorCode: 1, ErrorMessage: "Credential verification failed" },
    });
  }

  if (!body.BookingId || !body.Status) {
    logger.warn("flight_callback: missing required fields", { body });
    return res.status(200).json({
      Error: { ErrorCode: 2, ErrorMessage: "Missing required fields (BookingId, Status)" },
    });
  }

  try {
    await flightCallbackService.processCallback(body);
    return res.status(200).json({ Error: { ErrorCode: 0, ErrorMessage: "" } });
  } catch (err) {
    logger.error(`flight_callback: processing failed — ${err.message}`, {
      bookingId: body?.BookingId,
    });
    return res.status(200).json({
      Error: { ErrorCode: 3, ErrorMessage: "Processing failed" },
    });
  }
};

module.exports = { handleFlightCallback };