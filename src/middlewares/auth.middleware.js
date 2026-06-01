const jwt = require("jsonwebtoken");
const { jwtSecret, jwtRefreshSecret } = require("@config/auth");
const { HTTP_CODES } = require("@/config/constants");
const authService = require("@services/auth.service");

// Verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.error("No token provided", HTTP_CODES.UNAUTHORIZED);
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      req.newTokens = token;
    }
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.error("Invalid token", HTTP_CODES.UNAUTHORIZED);
    }
    if (error.name === "TokenExpiredError") {
      // Try to refresh the token using refresh token from body/header/cookie
      const refreshToken = authService.extractRefreshToken(req);
      if (!refreshToken) {
        return res.error("Token expired", HTTP_CODES.UNAUTHORIZED);
      }

      try {
        const tokens = await authService.refreshToken(refreshToken);
        const decoded = jwt.verify(tokens.accessToken, jwtSecret);
        req.user = decoded;
        req.newTokens = tokens;
        return next();
      } catch (refreshError) {
        return res.error("Session expired", HTTP_CODES.UNAUTHORIZED);
      }
    }
    next(error);
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.error("Unauthorized access", HTTP_CODES.FORBIDDEN);
    }
    next();
  };
};

// Optional JWT verification (doesn't fail if token is missing or invalid, but decodes if present)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }
    const token = authHeader.split(" ")[1];
    if (!token || token === "null" || token === "undefined") {
      return next();
    }
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      req.newTokens = token;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        const refreshToken = authService.extractRefreshToken(req);
        if (!refreshToken) {
          return next();
        }
        try {
          const tokens = await authService.refreshToken(refreshToken);
          const decoded = jwt.verify(tokens.accessToken, jwtSecret);
          req.user = decoded;
          req.newTokens = tokens;
          return next();
        } catch (refreshError) {
          return next();
        }
      }
      return next();
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { authMiddleware, restrictTo, optionalAuthMiddleware };
