const { prisma } = require("@libs/prisma");

// Fetch all active collections
async function getCollections() {
  return prisma.collection.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch collection by slug with products
async function getCollectionBySlug(slug) {
  return prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    include: {
      products: {
        where: { deletedAt: null },
        include: { model3D: true, material: true, tool: true },
      },
    },
  });
}

module.exports = { getCollections, getCollectionBySlug };
