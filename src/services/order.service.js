const { HTTP_CODES } = require("@/config/constants");
const { prisma } = require("@libs/prisma");
const { v4: uuidv4 } = require("uuid");

// Create order from cart
async function createOrder(customerId, { shippingAddress }) {
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId },
    include: { product: true },
  });
  if (!cartItems.length) return res.notFound();

  let totalAmount = 0;
  const orderItems = cartItems.map((item) => {
    totalAmount += item.product.price * item.quantity;
    return { productId: item.productId, quantity: item.quantity, unitPrice: item.product.price };
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
      customerId,
      totalAmount,
      shippingAddress,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } } },
  });

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { customerId } });

  return order;
}

// Get customer orders
async function getMyOrders(customerId) {
  return prisma.order.findMany({
    where: { customerId, deletedAt: null },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Cancel order
async function cancelOrder(id, customerId) {
  const order = await prisma.order.findFirst({
    where: { id: BigInt(id), customerId },
  });
  if (!order) return res.notFound();
  if (order.status !== "PENDING") return res.error("Only pending orders can be cancelled", HTTP_CODES.BAD_REQUESTED);

  return prisma.order.update({
    where: { id: BigInt(id) },
    data: { status: "CANCELLED" },
  });
}

/**
 * Fetch all orders with order items.
 */
async function getAllOrders() {
  return prisma.order.findMany({
    where: { deletedAt: null },
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, fullName: true, email: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single order by id with order items.
 */
async function getOrderById(id) {
  return prisma.order.findFirst({
    where: { id: BigInt(id), deletedAt: null },
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, fullName: true, email: true, slug: true } },
    },
  });
}

module.exports = { createOrder, getMyOrders, cancelOrder, getAllOrders, getOrderById };
