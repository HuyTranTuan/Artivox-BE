const { prisma } = require("@libs/prisma");
const { getRedis } = require("@libs/redis");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@/utils/AppError");

const CART_TTL = 3600; // 1 hour
const cacheKey = (customerId) => `cart:${customerId}`;

async function getCached(customerId) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(cacheKey(customerId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setCache(customerId, data) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(cacheKey(customerId), JSON.stringify(data), { EX: CART_TTL });
  } catch (e) {
    console.warn("Redis set failed:", e.message);
  }
}

async function invalidateCache(customerId) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(cacheKey(customerId));
  } catch (e) {
    console.warn("Redis del failed:", e.message);
  }
}

async function fetchFromDb(customerId) {
  return prisma.cartItem.findMany({
    where: { customerId },
    include: { product: { include: { model3D: { select: { id: true, productId: true, previewFileUrl: true, createdAt: true, updatedAt: true } }, material: true, tool: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Get customer cart (cache-first)
async function getCart(customerId) {
  const cached = await getCached(customerId);
  if (cached) return cached;
  const data = await fetchFromDb(customerId);
  await setCache(customerId, data);
  return data;
}

// Add to cart (upsert) — invalidates cache
async function addToCart(customerId, productId, quantity = 1) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new AppError("Product not found", HTTP_CODES.NOT_FOUND);

  const result = await prisma.cartItem.upsert({
    where: { customerId_productId: { customerId, productId } },
    update: { quantity: { increment: quantity } },
    create: { customerId, productId, quantity },
  });
  await invalidateCache(customerId);
  return result;
}

// Update cart item quantity — invalidates cache
async function updateCartItem(id, customerId, quantity) {
  const item = await prisma.cartItem.findFirst({ where: { id: BigInt(id), customerId } });
  if (!item) throw new AppError("Cart item not found", HTTP_CODES.NOT_FOUND);

  const result = await prisma.cartItem.update({
    where: { id: BigInt(id) },
    data: { quantity },
  });
  await invalidateCache(customerId);
  return result;
}

// Remove from cart — invalidates cache
async function removeFromCart(id, customerId) {
  const item = await prisma.cartItem.findFirst({ where: { id: BigInt(id), customerId } });
  if (!item) throw new AppError("Cart item not found", HTTP_CODES.NOT_FOUND);

  const result = await prisma.cartItem.delete({ where: { id: BigInt(id) } });
  await invalidateCache(customerId);
  return result;
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
