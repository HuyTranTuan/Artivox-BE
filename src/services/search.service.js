const { prisma } = require("@libs/prisma");

/**
 * Global search across all product types
 * Returns a mixed list of Models, Materials, and Tools
 */
async function searchGlobal(query, limit = 20, type = null) {
  const searchFilter = {
    AND: [
      { deletedAt: null },
      { isActive: true },
      {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
      },
    ],
  };

  if (type) {
    searchFilter.AND.push({ type: type });
  }

  const [products, discounts, articles] = await Promise.all([
    (!type || type === "MODEL" || type === "MATERIAL" || type === "TOOL") ? prisma.product.findMany({
      where: searchFilter,
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnail: true,
        description: true,
        type: true,
        basePrice: true,
        discountedPrice: true,
        ratingAvg: true,
        stock: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    }) : Promise.resolve([]),
    (!type || type === "DISCOUNT") ? prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { code: { contains: query, mode: "insensitive" } },
        ]
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    }) : Promise.resolve([]),
    (!type || type === "ARTICLE") ? prisma.article.findMany({
      where: {
        deletedAt: null,
        translations: {
          some: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } }
            ]
          }
        }
      },
      include: {
        translations: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    }) : Promise.resolve([])
  ]);

  const items = [
    ...products.map(p => ({ ...p, entityType: "PRODUCT" })),
    ...discounts.map(d => ({ ...d, entityType: "DISCOUNT" })),
    ...articles.map(a => ({ 
      ...a, 
      name: a.translations?.[0]?.title || "Unknown", 
      description: a.translations?.[0]?.summary || "", 
      entityType: "ARTICLE" 
    })),
  ];

  return {
    total: items.length,
    items,
  };
}

/**
 * Search models with filters, pagination, and sorting
 */
async function searchModels(query, filters = {}, page = 1, limit = 20, sortBy = "newest", sortOrder = "desc") {
  const skip = (page - 1) * limit;

  const searchFilter = {
    AND: [
      { deletedAt: null },
      { isActive: true },
      { type: "MODEL" },
      {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
      },
    ],
  };

  // Apply filters
  if (filters.collectionId) {
    searchFilter.AND.push({ collectionId: filters.collectionId });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    searchFilter.AND.push({
      basePrice: priceFilter,
    });
  }

  // Determine sort order
  let orderBy = { createdAt: "desc" };
  if (sortBy === "price") {
    orderBy = { basePrice: sortOrder };
  } else if (sortBy === "rating") {
    orderBy = { ratingAvg: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "newest") {
    orderBy = { createdAt: sortOrder };
  }

  // Get total count
  const total = await prisma.product.count({
    where: searchFilter,
  });

  // Get paginated results
  const items = await prisma.product.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnail: true,
      description: true,
      type: true,
      basePrice: true,
      discountedPrice: true,
      ratingAvg: true,
      stock: true,
      model3D: {
        select: { id: true, productId: true, previewFileUrl: true, createdAt: true, updatedAt: true },
      },
      collection: {
        select: { id: true, name: true, slug: true },
      },
    },
    skip,
    take: limit,
    orderBy,
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items,
  };
}

/**
 * Search materials with filters, pagination, and sorting
 */
async function searchMaterials(query, filters = {}, page = 1, limit = 20, sortBy = "newest", sortOrder = "desc") {
  const skip = (page - 1) * limit;

  const searchFilter = {
    AND: [
      { deletedAt: null },
      { isActive: true },
      { type: "MATERIAL" },
      {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
      },
    ],
  };

  // Apply filters
  if (filters.collectionId) {
    searchFilter.AND.push({ collectionId: filters.collectionId });
  }

  if (filters.materialType) {
    searchFilter.AND.push({
      material: { type: filters.materialType },
    });
  }

  if (filters.color) {
    searchFilter.AND.push({
      material: { color: { contains: filters.color, mode: "insensitive" } },
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    searchFilter.AND.push({
      basePrice: priceFilter,
    });
  }

  // Determine sort order
  let orderBy = { createdAt: "desc" };
  if (sortBy === "price") {
    orderBy = { basePrice: sortOrder };
  } else if (sortBy === "rating") {
    orderBy = { ratingAvg: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "newest") {
    orderBy = { createdAt: sortOrder };
  }

  // Get total count
  const total = await prisma.product.count({
    where: searchFilter,
  });

  // Get paginated results
  const items = await prisma.product.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnail: true,
      description: true,
      type: true,
      basePrice: true,
      discountedPrice: true,
      ratingAvg: true,
      stock: true,
      material: {
        select: { type: true, color: true, unit: true },
      },
      collection: {
        select: { id: true, name: true, slug: true },
      },
    },
    skip,
    take: limit,
    orderBy,
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items,
  };
}

/**
 * Search tools with filters, pagination, and sorting
 */
async function searchTools(query, filters = {}, page = 1, limit = 20, sortBy = "newest", sortOrder = "desc") {
  const skip = (page - 1) * limit;

  const searchFilter = {
    AND: [
      { deletedAt: null },
      { isActive: true },
      { type: "TOOL" },
      {
        OR: [{ name: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }],
      },
    ],
  };

  // Apply filters
  if (filters.collectionId) {
    searchFilter.AND.push({ collectionId: filters.collectionId });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceFilter = {};
    if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
    searchFilter.AND.push({
      basePrice: priceFilter,
    });
  }

  // Determine sort order
  let orderBy = { createdAt: "desc" };
  if (sortBy === "price") {
    orderBy = { basePrice: sortOrder };
  } else if (sortBy === "rating") {
    orderBy = { ratingAvg: sortOrder };
  } else if (sortBy === "name") {
    orderBy = { name: sortOrder };
  } else if (sortBy === "newest") {
    orderBy = { createdAt: sortOrder };
  }

  // Get total count
  const total = await prisma.product.count({
    where: searchFilter,
  });

  // Get paginated results
  const items = await prisma.product.findMany({
    where: searchFilter,
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnail: true,
      description: true,
      type: true,
      basePrice: true,
      discountedPrice: true,
      ratingAvg: true,
      stock: true,
      tool: {
        select: { specifications: true, slug: true },
      },
      collection: {
        select: { id: true, name: true, slug: true },
      },
    },
    skip,
    take: limit,
    orderBy,
  });

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items,
  };
}

module.exports = {
  searchGlobal,
  searchModels,
  searchMaterials,
  searchTools,
};
