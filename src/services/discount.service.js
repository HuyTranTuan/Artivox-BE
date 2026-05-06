const { prisma } = require("@libs/prisma");

/**
 * Fetch all discounts.
 */
async function getDiscounts() {
  return prisma.discount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single discount by slug.
 */
async function getDiscountBySlug(slug) {
  return prisma.discount.findFirst({
    where: { slug, isActive: true },
  });
}

module.exports = { getDiscounts, getDiscountBySlug };