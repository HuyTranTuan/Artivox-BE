const { getRedis } = require("@libs/redis");
const { HTTP_CODES } = require("@config/constants");

/**
 * Cache middleware
 * @param {string} prefix - The cache key prefix (e.g., 'products')
 * @param {number} ttl - Time to live in seconds (default 10 minutes)
 */
const cacheMiddleware = (prefix, ttl = 600) => async (req, res, next) => {
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

/**
 * Surgically patch a specific field in all matching cached JSON entries.
 * Use this for immediate price/stock updates without clearing the whole prefix.
 * @param {string} pattern - Redis key pattern, e.g. 'models:*'
 * @param {string} slug - The slug of the item to update inside each cached list
 * @param {Object} fieldUpdates - Fields to merge, e.g. { basePrice: 500000 }
 */
const patchCacheField = async (pattern, slug, fieldUpdates) => {
  const redisClient = getRedis();
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    for (const key of keys) {
      try {
        const raw = await redisClient.get(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);

        // Handle both array responses and paginated { items, total } shapes
        const patchItem = (item) => {
          if (item && (item.slug === slug || String(item.id) === String(slug))) {
            return { ...item, ...fieldUpdates };
          }
          return item;
        };

        let patched;
        if (Array.isArray(parsed)) {
          patched = parsed.map(patchItem);
        } else if (parsed && Array.isArray(parsed.items)) {
          patched = { ...parsed, items: parsed.items.map(patchItem) };
        } else {
          // Single-item cache (detail page)
          patched = patchItem(parsed);
        }

        const ttl = await redisClient.ttl(key);
        if (ttl > 0) {
          await redisClient.set(key, JSON.stringify(patched), { EX: ttl });
        } else {
          await redisClient.set(key, JSON.stringify(patched));
        }
      } catch (innerErr) {
        console.warn(`patchCacheField: failed on key ${key}:`, innerErr);
      }
    }
  } catch (error) {
    console.warn(`patchCacheField error for pattern ${pattern}:`, error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache,
  patchCacheField,
};
