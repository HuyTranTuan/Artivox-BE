/**
 * Middleware for validating query parameters using Zod schemas
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          status: "error",
          message: "Validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

module.exports = validateQuery;
