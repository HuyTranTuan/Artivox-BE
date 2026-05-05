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

module.exports = {
  getMaterials,
};
