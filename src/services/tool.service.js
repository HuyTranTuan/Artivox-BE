const { prisma } = require("@libs/prisma");

// Fetch all tool products.
async function getTools(query = {}) {
  const where = {
    deletedAt: null,
    type: "TOOL",
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { sku: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { tool: true },
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.skip,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    limit: query.limit,
    skip: query.skip,
  };
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
