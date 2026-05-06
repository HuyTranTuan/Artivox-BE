const { prisma } = require("@libs/prisma");

/**
 * Fetch all discount orders.
 */
async function getDiscountOrders() {
  return prisma.discountOrder.findMany({
    orderBy: { startsAt: "desc" },
  });
}

/**
 * Fetch a single discount order by id.
 */
async function getDiscountOrderById(id) {
  return prisma.discountOrder.findUnique({
    where: { id: BigInt(id) },
  });
}

module.exports = { getDiscountOrders, getDiscountOrderById };