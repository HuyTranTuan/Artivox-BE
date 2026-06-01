const { prisma } = require("@libs/prisma");
const { uploadProductImages, getSecureImageUrl } = require("@services/productImage.service");

/**
 * Fetch all model products (type=MODEL) with their Model3D details.
 */
async function getModels(query = {}) {
  const where = {
    deletedAt: null,
    type: "MODEL",
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
      include: { model3D: true, images: { orderBy: { sortOrder: 'asc' } } },
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

async function getModelBySlug(slug, query = {}) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
      type: "MODEL",
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    include: { model3D: true, collection: true, images: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!product) return null;

  return {
    ...product,
    images: product.images?.map(img => ({ ...img, url: getSecureImageUrl(img.url) }))
  };
}

async function createModel(data, files) {
  // Create Product and Model3D
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: "MODEL",
      basePrice: parseFloat(data.basePrice || 0),
      stock: parseInt(data.stock || 0, 10),
      isActive: data.isActive !== undefined ? (data.isActive === "true" || data.isActive === true) : true,
      ...(data.collectionId && { collectionId: BigInt(data.collectionId) }),
      model3D: {
        create: {
          previewFileUrl: data.previewFileUrl || "",
          sourceFileUrl: data.sourceFileUrl || "",
        }
      }
    }
  });

  // Handle images
  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getModelBySlug(product.slug);
}

async function updateModel(slug, data, files) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MODEL" },
    include: { model3D: true }
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
      model3D: {
        update: {
          ...(data.previewFileUrl !== undefined && { previewFileUrl: data.previewFileUrl }),
          ...(data.sourceFileUrl !== undefined && { sourceFileUrl: data.sourceFileUrl }),
        }
      }
    }
  });

  // Handle new images (append for now)
  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getModelBySlug(product.slug);
}

async function deleteModel(slug) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MODEL" }
  });
  if (!existing) return null;

  return prisma.product.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() }
  });
}

module.exports = {
  getModels,
  getModelBySlug,
  createModel,
  updateModel,
  deleteModel
};
