const { prisma } = require("@libs/prisma");

// Get customer cart
async function getCart(customerId) {
  return prisma.cartItem.findMany({
    where: { customerId },
    include: { product: { include: { model3D: true, material: true, tool: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Add to cart (upsert)
async function addToCart(customerId, productId, quantity = 1) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) return res.notFound();

  return prisma.cartItem.upsert({
    where: { customerId_productId: { customerId, productId } },
    update: { quantity: { increment: quantity } },
    create: { customerId, productId, quantity },
  });
}

// Update cart item quantity
async function updateCartItem(id, customerId, quantity) {
  const item = await prisma.cartItem.findFirst({ where: { id: BigInt(id), customerId } });
  if (!item) return res.notFound();

  return prisma.cartItem.update({
    where: { id: BigInt(id) },
    data: { quantity },
  });
}

// Remove from cart
async function removeFromCart(id, customerId) {
  const item = await prisma.cartItem.findFirst({ where: { id: BigInt(id), customerId } });
  if (!item) return res.notFound();

  return prisma.cartItem.delete({ where: { id: BigInt(id) } });
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
