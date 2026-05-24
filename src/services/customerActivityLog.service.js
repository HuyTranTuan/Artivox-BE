const { prisma } = require("@libs/prisma");

/**
 * Fetch all customer activity logs.
 */
async function getCustomerActivityLogs() {
  return prisma.customerActivityLog.findMany({
    include: {
      customer: { select: { id: true, fullName: true, email: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function createCustomerActivityLog(data) {
  return prisma.customerActivityLog.create({
    data,
  });
}

async function createLoginSuccessLog(email, userId, ip, userAgent, type = "CUSTOMER") {
  return prisma.customerActivityLog.create({
    data: {
      type,
      customerId: userId,
      email,
      action: "LOGIN",
      description: "Login success",
      ipAddress: ip,
      userAgent: userAgent,
    },
  });
}

async function createLoginFailLog(email, ip, userAgent, type = "CUSTOMER") {
  return prisma.customerActivityLog.create({
    data: {
      type,
      email,
      action: "LOGIN_FAILED",
      description: "Login failed",
      ipAddress: ip,
      userAgent: userAgent,
    },
  });
}

module.exports = { getCustomerActivityLogs, createCustomerActivityLog, createLoginSuccessLog, createLoginFailLog };