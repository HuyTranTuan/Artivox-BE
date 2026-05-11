const bcrypt = require("bcryptjs");
const { prisma } = require("@libs/prisma");
const { v7 } = require("uuid");
const { HTTP_CODES } = require("@/config/constants");

const saltRound = Number(process.env.BCRYPT_SALT) || 10;

// Get Admin dashboard
async function getAdminDashboard() {
  const [staffStats, topProducts, revenueByProductType, financialKPIs, abandonedCartStats, paymentMethodDistribution, timeSeries30Days] = await Promise.all([
    getStaffStats(),
    getTopProducts(),
    getRevenueByProductType(),
    getFinancialKPIs(),
    getAbandonedCartStats(),
    getPaymentMethodDistribution(),
    getTimeSeries30Days(),
  ]);

  // Combine and structure the dashboard payload cleanly
  return {
    widgets: {
      ...financialKPIs,
      ...abandonedCartStats,
    },
    tables: {
      topStaffByArticles: staffStats.topStaffByArticles,
      topStaffByChatRooms: staffStats.topStaffByChatRooms,
      topProductsWithDetails: topProducts,
    },
    charts: {
      revenueByProductType,
      paymentMethodDistribution,
      timeSeries30Days,
    },
  };
}

// Get all admin users
async function getAdminUsers() {
  return prisma.adminUser.findMany({
    where: { deletedAt: null, role: "STAFF" },
    select: { id: true, email: true, fullName: true, phone: true, createdAt: true, updatedAt: true },
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
  if (!order) throw new Error("Not found", HTTP_CODES.NOT_FOUND);

  return prisma.order.update({
    where: { id: BigInt(id) },
    data: { status, ...(assignedAdminId && { assignedAdminId }) },
    include: { items: { include: { product: true } } },
  });
}

// Get all customers
async function getCustomers() {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      slug: true,
      address: true,
      gender: true,
      phone: true,
      dateOfBirth: true,
      verifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return customers;
}

// Get customer by slug
async function getCustomer(slug) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, slug },
    select: {
      id: true,
      email: true,
      fullName: true,
      slug: true,
      address: true,
      gender: true,
      phone: true,
      dateOfBirth: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
  if (!customer) throw new Error("Not found", HTTP_CODES.NOT_FOUND);
  return customer;
}

// Ban Customer
async function getCustomerBanned(slug) {
  const customer = await prisma.customer.update({
    where: { deletedAt: null, slug },
    data: { deletedAt: new Date() },
  });
  return customer;
}

// Staff create
async function createStaff(email, password, fullName, phone) {
  const existing = await prisma.adminUser.findFirst({
    where: {
      OR: [{ email: email }, { phone: phone }],
    },
  });
  if (existing) throw new Error("Email or Phone number already registered", HTTP_CODES.CONFLICT);

  const hashedPassword = await bcrypt.hash(password, saltRound);
  // const id = v7();
  await prisma.adminUser.create({
    data: { email, password: hashedPassword, fullName, phone },
  });
  return true;
}

// Staff Decentralize
async function decentralizeStaff(email, create, update, del) {
  const customer = await prisma.adminUser.findFirst({
    where: { email, role: "STAFF", deletedAt: null },
  });
  if (!customer) throw new Error("Not found", HTTP_CODES.NOT_FOUND);
  await prisma.adminUser.update({
    where: { email, deletedAt: null },
    data: {
      permission: JSON.stringify({ create, update, del }),
    },
  });

  return customer;
}

/**
 * Helper Function
 */

// --- HELPER 1: Staff Performance Stats ---
async function getStaffStats() {
  const staffList = await prisma.adminUser.findMany({
    where: {
      deletedAt: null,
      role: "STAFF",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          articles: { where: { publishedAt: { not: null } } },
          chatRooms: { where: { messages: { some: {} } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const topStaffByArticles = [...staffList].sort((a, b) => b._count.articles - a._count.articles).slice(0, 5);

  const topStaffByChatRooms = [...staffList].sort((a, b) => b._count.chatRooms - a._count.chatRooms).slice(0, 5);

  return { topStaffByArticles, topStaffByChatRooms };
}

// --- HELPER 2: Top Selling Products ---
async function getTopProducts() {
  const topSellingProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { status: "COMPLETED" } },
    _sum: { quantity: true },
    orderBy: {
      _sum: { quantity: "desc" },
    },
    take: 5,
  });

  return Promise.all(
    topSellingProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, type: true, basePrice: true },
      });
      return {
        productId: item.productId,
        name: product?.name,
        type: product?.type,
        totalSold: item._sum.quantity || 0,
        estimatedRevenue: (item._sum.quantity || 0) * (product?.basePrice || 0),
      };
    }),
  );
}

// --- HELPER 3: Revenue by Product Category (Pie Chart 1) ---
async function getRevenueByProductType() {
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { status: "COMPLETED" } },
    select: {
      quantity: true,
      product: {
        select: {
          type: true,
          basePrice: true,
        },
      },
    },
  });

  return orderItems.reduce(
    (acc, item) => {
      const type = item.product?.type || "UNKNOWN";
      const price = item.product?.basePrice || 0;
      const total = price * item.quantity;
      acc[type] = (acc[type] || 0) + total;
      return acc;
    },
    { MODEL: 0, MATERIAL: 0, TOOL: 0 },
  );
}

// --- HELPER 4: Financial KPIs (Revenue, Orders, AOV) ---
async function getFinancialKPIs() {
  const aovData = await prisma.order.aggregate({
    where: { status: "COMPLETED" },
    _sum: { totalAmount: true },
    _count: { id: true },
  });

  const totalRevenue = aovData._sum.totalAmount || 0;
  const totalCompletedOrders = aovData._count.id || 0;
  const averageOrderValue = totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0;

  return { totalRevenue, totalCompletedOrders, averageOrderValue };
}

// --- HELPER 5: Abandoned Cart Metrics ---
async function getAbandonedCartStats() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const activeCartsCount = await prisma.cartItem.groupBy({
    by: ["customerId"],
  });
  const totalActiveCarts = activeCartsCount.length;

  const abandonedCartsCount = await prisma.cartItem.groupBy({
    by: ["customerId"],
    where: { updatedAt: { lte: oneDayAgo } },
  });
  const totalAbandonedCarts = abandonedCartsCount.length;
  const abandonedCartRate = totalActiveCarts > 0 ? parseFloat(((totalAbandonedCarts / totalActiveCarts) * 100).toFixed(2)) : 0;

  return { totalActiveCarts, totalAbandonedCarts, abandonedCartRate };
}

// --- HELPER 6: Payment Methods (Pie Chart 2) ---
async function getPaymentMethodDistribution() {
  const paymentDistribution = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: { status: "COMPLETED" },
    _count: { id: true },
    _sum: { totalAmount: true },
  });

  return paymentDistribution.map((item) => ({
    name: item.paymentMethod,
    value: item._count.id,
    revenue: item._sum.totalAmount || 0,
  }));
}

// --- HELPER 7: Last 30-Day Time Series (Line Charts) ---
async function getTimeSeries30Days() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newCustomers, completedOrders] = await Promise.all([
    prisma.customer.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: "COMPLETED",
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    }),
  ]);

  const chartDataMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    chartDataMap[dateStr] = { date: dateStr, newCustomers: 0, revenue: 0, ordersCount: 0 };
  }

  newCustomers.forEach((c) => {
    const dateStr = c.createdAt.toISOString().split("T")[0];
    if (chartDataMap[dateStr]) chartDataMap[dateStr].newCustomers += 1;
  });

  completedOrders.forEach((o) => {
    const dateStr = o.createdAt.toISOString().split("T")[0];
    if (chartDataMap[dateStr]) {
      chartDataMap[dateStr].revenue += o.totalAmount;
      chartDataMap[dateStr].ordersCount += 1;
    }
  });

  return Object.values(chartDataMap);
}

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAllOrders,
  getAdminRevenue,
  updateOrderStatus,
  getCustomers,
  getCustomer,
  getCustomerBanned,
  createStaff,
  decentralizeStaff,
};
