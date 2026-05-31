const { PRISMA_ERRORS, HTTP_CODES } = require("@/config/constants");

// Global error handler middleware
const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.error("ERROR 💥:", err);
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }

  // Production: only send operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  if (err?.code === PRISMA_ERRORS.DUPLICATE) {
    return res.error({ message: "Duplicate entry." }, HTTP_CODES.CONFLICT);
  }

  console.error("ERROR 💥:", err.status);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

module.exports = { errorMiddleware };
