const { prisma } = require("@libs/prisma");

// Fetch all products with filters
async function getProducts(query = {}) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { slug: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    },
    include: { model3D: true, material: true, tool: true },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch product by slug
async function getProductBySlug(slug) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null },
    include: { model3D: true, material: true, tool: true, collection: true },
  });
}

// Update product discount campaign
async function updateProductDiscountCampaign(productId, discountId) {
  const product = await prisma.product.findFirst({
    where: { id: BigInt(productId), deletedAt: null },
  });
  if (!product) return null;

  const discount = await prisma.discount.findFirst({
    where: { id: BigInt(discountId), isActive: true },
  });
  if (!discount) return null;

  let discountedPrice = product.basePrice;
  if (discount.type === "PERCENT") {
    discountedPrice = product.basePrice - (product.basePrice * discount.value) / 100;
  } else if (discount.type === "FIXED") {
    discountedPrice = product.basePrice - discount.value;
  }

  // Ensure discountedPrice doesn't go below 0
  if (discountedPrice < 0) discountedPrice = 0;

  return prisma.product.update({
    where: { id: product.id },
    data: {
      discountCampainId: discount.id,
      discountedPrice,
    },
  });
}

// Remove product discount
async function removeProductDiscount(productId) {
  const product = await prisma.product.findFirst({
    where: { id: BigInt(productId), deletedAt: null },
  });
  if (!product) return null;

  return prisma.product.update({
    where: { id: product.id },
    data: {
      discountCampainId: null,
      discountedPrice: null,
    },
  });
}

module.exports = {
  getProducts,
  getProductBySlug,
  updateProductDiscountCampaign,
  removeProductDiscount,
};
