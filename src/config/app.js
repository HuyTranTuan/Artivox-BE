module.exports = {
  port: process.env.API_PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: (process.env.CORS_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean),
  baseUrl: process.env.BASE_URL,
};
