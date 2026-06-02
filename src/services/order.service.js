const { HTTP_CODES } = require("@/config/constants");
const { prisma } = require("@libs/prisma");
const { v4: uuidv4 } = require("uuid");
const notificationService = require("@services/notification.service");
const AppError = require("@/utils/AppError");

// Create order from items
async function createOrder(customerId, {
  shippingAddress,
  note,
  shippingFee = 0,
  discountAmount = 0,
  discountCode,
  paymentMethod = "BANK_TRANSFER",
  paymentStatus = "PENDING",
  deliveryDate,
  deliveryTime,
  items = [],
}) {
  if (!items || !items.length) {
    throw new AppError("Cart is empty", HTTP_CODES.BAD_REQUESTED);
  }

  // Validate items
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      throw new AppError("Invalid item in cart", HTTP_CODES.BAD_REQUESTED);
    }
  }

  const productIds = items.map((item) => BigInt(item.productId));
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
    },
  });

  const productMap = new Map(products.map((p) => [p.id.toString(), p]));

  let itemsAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = productMap.get(item.productId.toString());
    if (!product) {
      throw new AppError(`Product with ID ${item.productId} not found`, HTTP_CODES.NOT_FOUND);
    }
    const price = product.discountedPrice && product.discountedPrice > 0 ? product.discountedPrice : product.basePrice;
    itemsAmount += price * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
    });
  }

  let appliedDiscount = null;
  if (discountCode) {
    const discount = await prisma.discount.findUnique({
      where: { code: discountCode }
    });
    if (!discount || !discount.isActive) {
      throw new AppError("Invalid or inactive discount code", HTTP_CODES.BAD_REQUESTED);
    }
    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new AppError("Discount code usage limit reached", HTTP_CODES.BAD_REQUESTED);
    }
    if (discount.startsAt && new Date() < discount.startsAt) {
      throw new AppError("Discount code is not active yet", HTTP_CODES.BAD_REQUESTED);
    }
    if (discount.expiresAt && new Date() > discount.expiresAt) {
      throw new AppError("Discount code has expired", HTTP_CODES.BAD_REQUESTED);
    }
    if (discount.minOrderAmount && itemsAmount < discount.minOrderAmount) {
      throw new AppError(`Minimum order amount for this discount is ₫${discount.minOrderAmount}`, HTTP_CODES.BAD_REQUESTED);
    }
    
    appliedDiscount = discount;
    if (discount.type === "PERCENT") {
      discountAmount = (itemsAmount * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }
    if (discountAmount > itemsAmount) {
      discountAmount = itemsAmount;
    }
  }

  const totalAmount = itemsAmount + shippingFee - discountAmount + (itemsAmount * 0.1);

  const order = await prisma.order.create({
    data: {
      orderNumber: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
      customerId,
      totalAmount,
      shippingAddress,
      note,
      shippingFee,
      discountAmount,
      paymentMethod,
      paymentStatus,
      paidAt: paymentStatus === "PAID" ? new Date() : null,
      deliveryDate,
      deliveryTime,
      items: { create: orderItems },
    },
    include: { items: { include: { product: true } } },
  });

  if (appliedDiscount) {
    await prisma.discount.update({
      where: { id: appliedDiscount.id },
      data: { usedCount: { increment: 1 } }
    });

    await prisma.discountOrder.create({
      data: {
        code: appliedDiscount.code,
        name: appliedDiscount.name,
        orderId: order.id,
        value: discountAmount,
        startsAt: appliedDiscount.startsAt || new Date(),
        expiresAt: appliedDiscount.expiresAt,
      }
    });
  }

  // Send notification to admins about new order
  const admins = await prisma.adminUser.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  for (const admin of admins) {
    await notificationService.createNotification(admin.id, "ADMIN", {
      type: "ORDER_CREATED",
      title: "New Order Created",
      message: `New order: ${order.orderNumber} - ₫${totalAmount.toLocaleString("en-US")}`,
      metadata: { orderId: order.id.toString(), customerId: customerId.toString() },
    });
  }

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
  if (!order) {
    throw new AppError("Order not found", HTTP_CODES.NOT_FOUND);
  }
  if (order.status !== "PENDING") {
    throw new AppError("Only pending orders can be cancelled", HTTP_CODES.BAD_REQUESTED);
  }

  return prisma.order.update({
    where: { id: BigInt(id) },
    data: { status: "CANCELED" },
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
      customer: { select: { id: true, fullName: true, email: true, phone: true, slug: true } },
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
      customer: { select: { id: true, fullName: true, email: true, phone: true, slug: true } },
    },
  });
}

/**
 * Approve order (change status to APPROVED)
 */
async function approveOrder(orderId) {
  const order = await prisma.order.findFirst({
    where: { id: BigInt(orderId), deletedAt: null },
    include: { customer: { select: { id: true, fullName: true } } },
  });

  if (!order) {
    throw new AppError("Order not found", HTTP_CODES.NOT_FOUND);
  }
  if (order.status !== "PENDING") {
    throw new AppError("Only pending orders can be approved", HTTP_CODES.BAD_REQUESTED);
  }

  const updated = await prisma.order.update({
    where: { id: BigInt(orderId) },
    data: { status: "COMPLETED" },
    include: { items: { include: { product: true } } },
  });

  // Send notification to customer
  await notificationService.createNotification(order.customer.id, "CUSTOMER", {
    type: "ORDER_APPROVED",
    title: "Order Approved",
    message: `Your order ${order.orderNumber} has been approved and is being prepared`,
    metadata: { orderId: orderId.toString() },
  });

  return updated;
}

// Update order payment status
async function updateOrderPaymentStatus(id, customerId, paymentStatus) {
  const order = await prisma.order.findFirst({
    where: { id: BigInt(id), customerId },
  });
  if (!order) {
    throw new AppError("Order not found", HTTP_CODES.NOT_FOUND);
  }
  return prisma.order.update({
    where: { id: BigInt(id) },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "PAID" ? new Date() : order.paidAt,
    },
  });
}

module.exports = { createOrder, getMyOrders, cancelOrder, getAllOrders, getOrderById, approveOrder, updateOrderPaymentStatus };
