const { prisma } = require("@libs/prisma");
const { uploadProductImages, getSecureImageUrl } = require("@services/productImage.service");

/**
 * Fetch all material products.
 */
async function getMaterials(query = {}) {
  const where = {
    deletedAt: null,
    type: "MATERIAL",
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
      include: { material: true, images: { orderBy: { sortOrder: 'asc' } } },
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

/**
 * Fetch a single material product by slug.
 */
async function getMaterialBySlug(slug, query = {}) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      deletedAt: null,
      type: "MATERIAL",
      ...(query.isActive !== undefined && { isActive: query.isActive }),
    },
    include: { material: true, collection: true, images: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!product) return null;

  return {
    ...product,
    images: product.images?.map(img => ({ ...img, url: getSecureImageUrl(img.url) }))
  };
}

async function createMaterial(data, files) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      type: "MATERIAL",
      basePrice: parseFloat(data.basePrice || 0),
      stock: parseInt(data.stock || 0, 10),
      isActive: data.isActive !== undefined ? (data.isActive === "true" || data.isActive === true) : true,
      ...(data.collectionId && { collectionId: BigInt(data.collectionId) }),
      material: {
        create: {
          type: data.materialType || "FDM",
          color: data.color || "#000000",
          unit: data.unit || "ROLL",
        }
      }
    }
  });

  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getMaterialBySlug(product.slug);
}

async function updateMaterial(slug, data, files) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MATERIAL" },
    include: { material: true }
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
      material: {
        update: {
          ...(data.materialType !== undefined && { type: data.materialType }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.unit !== undefined && { unit: data.unit }),
        }
      }
    }
  });

  if (files) {
    await uploadProductImages(product.id, product.slug, files);
  }

  return getMaterialBySlug(product.slug);
}

async function deleteMaterial(slug) {
  const existing = await prisma.product.findFirst({
    where: { slug, deletedAt: null, type: "MATERIAL" }
  });
  if (!existing) return null;

  return prisma.product.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() }
  });
}

module.exports = {
  getMaterials,
  getMaterialBySlug,
  createMaterial,
  updateMaterial,
  deleteMaterial
};
