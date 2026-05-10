module.exports = {
  jwtSecret: process.env.AUTH_JWT_SECRET || "fallback_secret",
  jwtRefreshSecret: process.env.AUTH_JWT_REFRESH_SECRET || "fallback_refresh_secret",
  accessTokenTTL: process.env.AUTH_ACCESS_TOKEN_TTL || "1h",
  refreshTokenTTL: process.env.AUTH_REFRESH_TOKEN_TTL || "7d",
};
