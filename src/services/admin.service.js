const { jwtSecret } = require("@/config/auth");
const { prisma } = require("@libs/prisma");
const AppError = require("@utils/AppError");
const jwt = require("jsonwebtoken");

// Get all admin users
async function getAdminUsers() {
  return prisma.adminUser.findMany({
    where: { deletedAt: null, role: "STAFF" },
    select: { id: true, email: true, fullName: true, slug: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

// Get all orders (admin view)
async function getAllOrders(query = {}) {
  return prisma.order.findMany({
    where: {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.adminId && { assignedAdminId: BigInt(query.adminId) }),
    },
    include: {
      customer: { select: { id: true, fullName: true, email: true } },
      assignedAdmin: { select: { id: true, fullName: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Get revenue per admin
async function getAdminRevenue() {
  const admins = await prisma.adminUser.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      fullName: true,
      slug: true,
      role: true,
      orders: {
        where: { status: { in: ["PAID"] }, deletedAt: null },
        select: { totalAmount: true },
      },
    },
  });

  return admins.map((admin) => ({
    id: admin.id,
    fullName: admin.fullName,
    slug: admin.slug,
    role: admin.role,
    totalRevenue: admin.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    orderCount: admin.orders.length,
  }));
}

// Update order status
async function updateOrderStatus(id, status, assignedAdminId) {
  const order = await prisma.order.findUnique({ where: { id: BigInt(id) } });
  if (!order) throw new AppError("Order not found", 404);

  return prisma.order.update({
    where: { id: BigInt(id) },
    data: { status, ...(assignedAdminId && { assignedAdminId }) },
    include: { items: { include: { product: true } } },
  });
}

// Get all customers
async function getCustomers() {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, fullName: true, slug: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { getAdminUsers, getAllOrders, getAdminRevenue, updateOrderStatus, getCustomers };
