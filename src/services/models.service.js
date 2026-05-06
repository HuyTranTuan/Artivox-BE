const { prisma } = require("@libs/prisma");

/**
 * Fetch all model products (type=MODEL) with their Model3D details.
 */
async function getModels() {
  return prisma.product.findMany({
    where: { deletedAt: null, type: "MODEL" },
    include: { model3D: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch a single model product by slug.
 */
async function getModelBySlug(slug) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MODEL" },
    include: { model3D: true, collection: true },
  });
}

module.exports = {
  getModels,
  getModelBySlug,
};