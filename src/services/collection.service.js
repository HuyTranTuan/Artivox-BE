const { prisma } = require("@libs/prisma");
const { uploadCollectionImage, getSecureImageUrl } = require("@services/productImage.service");

// Fetch all active collections (public)
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
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.skip,
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    items: items.map((c) => ({ ...c, image: getSecureImageUrl(c.image), itemCount: c._count.products })),
    total,
    limit: query.limit,
    skip: query.skip,
  };
}

// Fetch all collections (admin, regardless of isActive)
async function getCollectionsAdmin(query = {}) {
  const where = {
    deletedAt: null,
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.collection.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.skip,
    }),
    prisma.collection.count({ where }),
  ]);

  return {
    items: items.map((c) => ({ ...c, image: getSecureImageUrl(c.image), itemCount: c._count.products })),
    total,
    limit: query.limit,
    skip: query.skip,
  };
}

// Fetch collection by slug with products
async function getCollectionBySlug(slug) {
  const collection = await prisma.collection.findFirst({
    where: { slug, deletedAt: null },
    include: {
      products: {
        where: { deletedAt: null },
        include: { model3D: { select: { id: true, productId: true, previewFileUrl: true, createdAt: true, updatedAt: true } }, material: true, tool: true, images: true },
      },
    },
  });
  if (!collection) return null;
  return {
    ...collection,
    image: getSecureImageUrl(collection.image),
    products: collection.products.map((p) => ({
      ...p,
      images: p.images?.map((img) => ({ ...img, url: getSecureImageUrl(img.url) })),
    })),
  };
}

// Create collection
async function createCollection(data, files) {
  const collection = await prisma.collection.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      image: null,
      isActive: data.isActive !== undefined ? data.isActive === "true" || data.isActive === true : true,
    },
  });

  if (files?.image?.[0]) {
    const imageUrl = await uploadCollectionImage(collection.id, files.image[0]);
    return prisma.collection.update({
      where: { id: collection.id },
      data: { image: imageUrl },
    });
  }

  return collection;
}

// Update collection by slug
async function updateCollectionBySlug(slug, data, files) {
  const existing = await prisma.collection.findFirst({ where: { slug, deletedAt: null } });
  if (!existing) return null;

  let imageUrl = existing.image;
  if (files?.image?.[0]) {
    imageUrl = await uploadCollectionImage(existing.id, files.image[0]);
  }

  return prisma.collection.update({
    where: { id: existing.id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.slug && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(imageUrl !== existing.image && { image: imageUrl }),
      ...(data.isActive !== undefined && { isActive: data.isActive === "true" || data.isActive === true }),
    },
  });
}

// Add product to collection by product slug
async function addProductToCollection(collectionId, productSlug) {
  const product = await prisma.product.findFirst({
    where: { slug: productSlug, deletedAt: null },
  });
  if (!product) return null;

  return prisma.product.update({
    where: { id: product.id },
    data: { collectionId: BigInt(collectionId) },
  });
}

// Remove product from collection
async function removeProductFromCollection(productId) {
  return prisma.product.update({
    where: { id: BigInt(productId) },
    data: { collectionId: null },
  });
}

async function deleteCollectionBySlug(slug) {
  const existing = await prisma.collection.findFirst({ where: { slug, deletedAt: null } });
  if (!existing) return null;

  return prisma.collection.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
}

module.exports = {
  getCollections,
  getCollectionsAdmin,
  getCollectionBySlug,
  createCollection,
  updateCollectionBySlug,
  addProductToCollection,
  removeProductFromCollection,
  deleteCollectionBySlug,
};

