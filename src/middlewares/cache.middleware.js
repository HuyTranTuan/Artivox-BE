const { getRedis } = require("@libs/redis");
const { HTTP_CODES } = require("@config/constants");

/**
 * Cache middleware
 * @param {string} prefix - The cache key prefix (e.g., 'products')
 * @param {number} ttl - Time to live in seconds (default 5 minutes)
 */
const cacheMiddleware = (prefix, ttl = 300) => async (req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  const redisClient = getRedis();
  if (!redisClient) {
    return next();
  }

  // Construct a unique key based on the prefix, role, and query parameters
  const rolePrefix = req.user && (req.user.role === "ADMIN" || req.user.role === "STAFF") ? "admin" : "public";
  const key = `${prefix}:${rolePrefix}:${req.originalUrl || req.url}`;

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      return res.success(JSON.parse(cachedData), "Fetched from cache", HTTP_CODES.OK);
    }

    // Intercept res.success to cache the data before sending it
    const originalSuccess = res.success;
    res.success = function (data, message, statusCode = 200) {
      // Don't await here, let it cache in the background
      redisClient.set(key, JSON.stringify(data), { EX: ttl }).catch((err) => {
        console.warn(`Redis Cache Set Error for ${key}:`, err);
      });

      return originalSuccess.call(this, data, message, statusCode);
    };

    next();
  } catch (error) {
    console.warn(`Redis Cache Get Error for ${key}:`, error);
    next();
  }
};

/**
 * Clear cache utility function
 * @param {string} pattern - The pattern to clear (e.g., 'products:*')
 */
const clearCache = async (pattern) => {
  const redisClient = getRedis();
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn(`Redis Cache Clear Error for pattern ${pattern}:`, error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
};
