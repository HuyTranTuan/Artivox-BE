const { prisma } = require("@libs/prisma");

/**
 * Fetch all material products.
 */
async function getMaterials() {
  return prisma.product.findMany({
    where: { deletedAt: null, type: "MATERIAL" },
    include: { material: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single material product by slug.
 */
async function getMaterialBySlug(slug) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MATERIAL" },
    include: { material: true, collection: true },
  });
}

module.exports = {
  getMaterials,
  getMaterialBySlug,
};
