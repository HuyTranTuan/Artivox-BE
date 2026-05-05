module.exports = {
  jwtSecret: process.env.JWT_SECRET || "fallback_secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret",
  accessTokenTTL: "1h",
  refreshTokenTTL: "7d",
};
