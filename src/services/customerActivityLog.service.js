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

module.exports = { getCustomerActivityLogs };