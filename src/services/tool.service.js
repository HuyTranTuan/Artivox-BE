const { prisma } = require("@libs/prisma");
const { uploadProductImages, getSecureImageUrl } = require("@services/productImage.service");

// Fetch all tool products.
async function getTools(query = {}) {
  const where = {
    deletedAt: null,
    type: "TOOL",
    ...(query.isActive !== undefined && { isActive: query.isActive }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { tool: true, images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit,
      skip: query.skip,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(p => ({
      ...p,
      images: p.images?.map(img => ({ ...img, url: getSecureImageUrl(img.url) }))
    })),
    total,
    limit: query.limit,
    skip: query.skip,
  };
}

// Fetch a single tool product by slug.
async function getToolBySlug(slug, query = {}) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
      type: "TOOL",
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    include: { tool: true, collection: true, images: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!product) return null;

  return {
    ...product,
    images: product.images?.map(img => ({ ...img, url: getSecureImageUrl(img.url) }))
  };
}

async function createTool(data, files) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: "TOOL",
      basePrice: parseFloat(data.basePrice || 0),
      stock: parseInt(data.stock || 0, 10),
      isActive: data.isActive !== undefined ? (data.isActive === "true" || data.isActive === true) : true,
      ...(data.collectionId && { collectionId: BigInt(data.collectionId) }),
      tool: {
        create: {
          slug: data.slug,
          specifications: data.specifications ? (typeof data.specifications === 'string' ? data.specifications : JSON.stringify(data.specifications)) : null,
        }
      }
    }
  });

  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getToolBySlug(product.slug);
}

async function updateTool(slug, data, files) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "TOOL" },
    include: { tool: true }
  });

  if (!existing) return null;

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.basePrice !== undefined && { basePrice: parseFloat(data.basePrice) }),
      ...(data.stock !== undefined && { stock: parseInt(data.stock, 10) }),
      ...(data.isActive !== undefined && { isActive: (data.isActive === "true" || data.isActive === true) }),
      ...(data.collectionId !== undefined && { collectionId: data.collectionId ? BigInt(data.collectionId) : null }),
      tool: {
        update: {
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.specifications !== undefined && { specifications: data.specifications ? (typeof data.specifications === 'string' ? data.specifications : JSON.stringify(data.specifications)) : existing.tool.specifications }),
        }
      }
    }
  });

  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getToolBySlug(product.slug);
}

async function deleteTool(slug) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "TOOL" }
  });
  if (!existing) return null;

  return prisma.product.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() }
  });
}

module.exports = {
  getTools,
  getToolBySlug,
  createTool,
  updateTool,
  deleteTool
};
