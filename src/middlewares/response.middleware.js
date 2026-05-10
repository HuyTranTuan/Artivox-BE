// Attach res.success() and res.error() helpers
const responseMiddleware = (req, res, next) => {
  res.success = (data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  };

  res.error = (message = "Bad Request", statusCode = 400, errors = null) => {
    return res.status(statusCode).json({
      status: "error",
      message,
      ...(errors && { errors }),
    });
  };

  next();
};

module.exports = { responseMiddleware };
