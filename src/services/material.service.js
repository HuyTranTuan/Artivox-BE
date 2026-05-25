const { prisma } = require("@libs/prisma");

/**
 * Fetch all material products.
 */
async function getMaterials(query = {}) {
  const where = {
    deletedAt: null,
    type: "MATERIAL",
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
      include: { material: true },
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
