const { createClient } = require("redis");

let redisClient;

// Initialize Redis client
async function initRedis() {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
    redisClient.on("error", (err) => console.error("Redis error:", err));
    await redisClient.connect();
    console.log("✅ Redis connected");
  } catch (error) {
    console.warn("⚠️  Redis not available:", error.message);
  }
}

function getRedis() {
  return redisClient;
}

module.exports = { initRedis, getRedis };
