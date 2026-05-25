const materialService = require("@services/material.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");

// Fetch all material products
const getMaterials = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await materialService.getMaterials(query);

  return res.paginatedSuccess(
    data.items,
    {
      total: data.total,
      limit: data.limit,
      skip: data.skip,
    },
    "Materials fetched",
  );
});

// Fetch a single material product by slug
const getMaterialBySlug = catchAsync(async (req, res) => {
  const data = await materialService.getMaterialBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Material detail fetched");
});

module.exports = { getMaterials, getMaterialBySlug };
