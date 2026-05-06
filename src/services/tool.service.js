const { prisma } = require("@libs/prisma");

// Fetch all tool products.
async function getTools() {
  return prisma.product.findMany({
    where: { deletedAt: null, type: "TOOL" },
    include: { tool: true },
    orderBy: { createdAt: "desc" },
  });
}

// Fetch a single tool product by slug.
async function getToolBySlug(slug) {
  return prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "TOOL" },
    include: { tool: true, collection: true },
  });
}

module.exports = {
  getTools,
  getToolBySlug,
};
