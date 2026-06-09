const rateLimit = require("express-rate-limit");
const { HTTP_CODES } = require("@/config/constants");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    return res.status(HTTP_CODES.TOO_MANY_REQUESTS || 429).json({
      status: "error",
      message: "Too many requests from this IP, please try again after 15 minutes",
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
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
