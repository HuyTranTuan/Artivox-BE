const { prisma } = require("@libs/prisma");

/**
 * Fetch all model products (type=MODEL) with their Model3D details.
 */
async function getModels(query = {}) {
  const where = {
    deletedAt: null,
    type: "MODEL",
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
      include: { model3D: true },
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
