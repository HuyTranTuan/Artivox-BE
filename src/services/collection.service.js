const { prisma } = require("@libs/prisma");

// Fetch all active collections
async function getCollections(query = {}) {
  const where = {
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.collection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.skip,
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    items,
    total,
    limit: query.limit,
    skip: query.skip,
  };
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
