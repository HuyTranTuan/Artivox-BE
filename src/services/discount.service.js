const { prisma } = require("@libs/prisma");

// Fetch active discounts (public)
async function getDiscounts() {
  return prisma.discount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch all discounts (admin — regardless of isActive)
async function getDiscountsAdmin() {
  return prisma.discount.findMany({
    where: {},
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch a single discount by slug
async function getDiscountBySlug(slug) {
  return prisma.discount.findFirst({
    where: { slug },
    include: { products: { where: { deletedAt: null }, select: { id: true, name: true, slug: true, basePrice: true, discountedPrice: true } } },
  });
}

// Create discount
async function createDiscount(data) {
  return prisma.discount.create({
    data: {
      code: data.code,
      name: data.name,
      slug: data.slug,
      type: data.type, // FIXED | PERCENT
      value: parseFloat(data.value),
      minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
      maxUses: data.maxUses ? parseInt(data.maxUses, 10) : null,
      isActive: data.isActive !== undefined ? data.isActive === "true" || data.isActive === true : true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

// Update discount by slug
async function updateDiscount(slug, data) {
  const existing = await prisma.discount.findFirst({ where: { slug } });
  if (!existing) return null;

  return prisma.discount.update({
    where: { id: existing.id },
    data: {
      ...(data.code && { code: data.code }),
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.type && { type: data.type }),
      ...(data.value !== undefined && { value: parseFloat(data.value) }),
      ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ? parseInt(data.maxUses, 10) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive === "true" || data.isActive === true }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt ? new Date(data.startsAt) : null }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
    },
  });
}

// Soft-delete discount (set isActive = false)
async function deleteDiscount(slug) {
  const existing = await prisma.discount.findFirst({ where: { slug } });
  if (!existing) return null;

  return prisma.discount.update({
    where: { id: existing.id },
    data: { isActive: false },
  });
}

module.exports = {
  getDiscounts,
  getDiscountsAdmin,
  getDiscountBySlug,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};