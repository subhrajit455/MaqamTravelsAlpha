const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

const handler = (req, res) =>
  sendError(res, { message: 'Too many requests, please try again later.', statusCode: 429 });

// General API limiter — applies to all routes
const apiLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  handler,
});

// Stricter limiter for auth routes (login/register)
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10, // only 10 attempts per 15 min
  standardHeaders:  true,
  legacyHeaders:    false,
  handler,
  skipSuccessfulRequests: true, // don't count successful logins
});

// Search limiter — SRDV calls are expensive so limit them
const searchLimiter = rateLimit({
  windowMs:        1 * 60 * 1000, // 1 minute
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});

<<<<<<< HEAD
module.exports = { apiLimiter, authLimiter, searchLimiter };
=======
// Payment limiter — prevent brute force or payment creation abuse
const paymentLimiter = rateLimit({
  windowMs:        1 * 60 * 1000, // 1 minute
  max:             10,            // 10 payments per minute
  standardHeaders: true,
  legacyHeaders:   false,
  handler,
});

module.exports = { apiLimiter, authLimiter, searchLimiter, paymentLimiter };
>>>>>>> 204c8b51f9176295a728cea037af26b59d540007
