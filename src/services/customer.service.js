const { prisma } = require("@libs/prisma");

/**
 * Fetch all customers.
 */
async function getCustomers() {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    select: { id: true, email: true, fullName: true, slug: true, phone: true, address: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single customer by slug.
 */
async function getCustomerBySlug(slug) {
  return prisma.customer.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, email: true, fullName: true, slug: true, phone: true, address: true, dateOfBirth: true, gender: true, isActive: true, createdAt: true },
  });
}

module.exports = { getCustomers, getCustomerBySlug };