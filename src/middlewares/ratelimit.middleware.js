const rateLimit = require("express-rate-limit");
const { HTTP_CODES } = require("@/config/constants");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    return res.status(HTTP_CODES.TOO_MANY_REQUESTS || 429).json({
      status: "error",
      message: "Too many requests from this IP, please try again after 15 minutes",
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 requests per `window` for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(HTTP_CODES.TOO_MANY_REQUESTS || 429).json({
      status: "error",
      message: "Too many authentication attempts, please try again after an hour",
    });
  },
});

module.exports = { apiLimiter, authLimiter };
