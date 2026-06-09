const { prisma } = require("@libs/prisma");

// Fetch all products with filters
async function getProducts(query = {}) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.type && { type: query.type }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { slug: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          ...(!isNaN(Number(query.search)) ? [{ basePrice: { equals: Number(query.search) } }] : []),
        ],
      }),
    },
    include: { model3D: true, material: true, tool: true },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch product by slug
async function getProductBySlug(slug, query = {}) {
  return prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
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

// Rate product
async function rateProduct(productSlug, rating) {
  const product = await prisma.product.findFirst({
    where: { slug: productSlug, deletedAt: null },
  });
  if (!product) return null;

  const newRatingCount = [...(product.ratingCount || []), rating];
  const newRatingAvg = newRatingCount.reduce((a, b) => a + b, 0) / newRatingCount.length;

  return prisma.product.update({
    where: { id: product.id },
    data: {
      ratingCount: newRatingCount,
      ratingAvg: newRatingAvg,
    },
  });
}

// Update product
async function updateProduct(productId, data) {
  const product = await prisma.product.findFirst({
    where: { id: BigInt(productId), deletedAt: null },
  });
  if (!product) return null;

  const updateData = {};
  if (data.collectionId !== undefined) {
    updateData.collectionId = data.collectionId ? BigInt(data.collectionId) : null;
  }
  
  if (data.discountCampainId !== undefined) {
    if (data.discountCampainId) {
      const discount = await prisma.discount.findFirst({
        where: { id: BigInt(data.discountCampainId), isActive: true },
      });
      if (discount) {
        updateData.discountCampainId = discount.id;
        let discountedPrice = product.basePrice;
        if (discount.type === "PERCENT") {
          discountedPrice = product.basePrice - (product.basePrice * discount.value) / 100;
        } else if (discount.type === "FIXED") {
          discountedPrice = product.basePrice - discount.value;
        }
        if (discountedPrice < 0) discountedPrice = 0;
        updateData.discountedPrice = discountedPrice;
      }
    } else {
      updateData.discountCampainId = null;
      updateData.discountedPrice = null;
    }
  }
  console.log(updateData)

  return prisma.product.update({
    where: { id: product.id },
    data: updateData,
  });
}

module.exports = {
  getProducts,
  getProductBySlug,
  updateProductDiscountCampaign,
  removeProductDiscount,
  rateProduct,
  updateProduct,
};
