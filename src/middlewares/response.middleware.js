const { HTTP_CODES } = require("@/config/constants");

// Attach res.success() and res.error() helpers
const responseMiddleware = (req, res, next) => {
  res.success = (data, message = "Success", statusCode = HTTP_CODES.OK) => {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  };

  res.error = (message = "Interval server error", statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR, errors = null) => {
    return res.status(statusCode).json({
      status: "error",
      message,
      ...(errors && { errors }),
    });
  };

  // Not found
  res.notFound = () => {
    res.error("Resource not found.", HTTP_CODES.NOT_FOUND);
  };

  // Unauthorized
  res.unauthorized = () => {
    res.error("Unauthorized.", HTTP_CODES.UNAUTHORIZED);
  };

  next();
};

module.exports = { responseMiddleware };
