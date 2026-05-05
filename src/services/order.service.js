const { prisma } = require("@libs/prisma");
const { v4: uuidv4 } = require("uuid");
const AppError = require("@utils/AppError");

// Create order from cart
async function createOrder(customerId, { shippingAddress }) {
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId },
    include: { product: true },
  });
  if (!cartItems.length) throw new AppError("Cart is empty", 400);

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
    where: { id: parseInt(id), customerId },
  });
  if (!order) throw new AppError("Order not found", 404);
  if (order.status !== "PENDING") throw new AppError("Only pending orders can be cancelled", 400);

  return prisma.order.update({
    where: { id: parseInt(id) },
    data: { status: "CANCELLED" },
  });
}

module.exports = { createOrder, getMyOrders, cancelOrder };
