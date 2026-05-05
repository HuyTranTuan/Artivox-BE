// Attach res.success() and res.fail() helpers
const responseMiddleware = (req, res, next) => {
  res.success = (data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      status: "success",
      message,
      data,
    });
  };

  res.fail = (message = "Bad Request", statusCode = 400, errors = null) => {
    return res.status(statusCode).json({
      status: "fail",
      message,
      ...(errors && { errors }),
    });
  };

  next();
};

module.exports = { responseMiddleware };
