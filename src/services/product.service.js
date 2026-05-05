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
          { sku: { contains: query.search, mode: "insensitive" } },
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

module.exports = { getProducts, getProductBySlug };
