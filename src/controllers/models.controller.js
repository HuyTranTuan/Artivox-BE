const modelsService = require("@services/models.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");

// Fetch all model products
const getModels = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await modelsService.getModels(query);

  return res.paginatedSuccess(
    data.items,
    {
      total: data.total,
      limit: data.limit,
      skip: data.skip,
    },
    "Models fetched",
  );
});

// Fetch a single model product by slug
const getModelBySlug = catchAsync(async (req, res) => {
  const data = await modelsService.getModelBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Model detail fetched");
});

module.exports = { getModels, getModelBySlug };
