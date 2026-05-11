const modelsService = require("@services/models.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all model products
const getModels = catchAsync(async (req, res) => {
  const data = await modelsService.getModels();
  return res.success(data, "Models fetched");
});

// Fetch a single model product by slug
const getModelBySlug = catchAsync(async (req, res) => {
  const data = await modelsService.getModelBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Model detail fetched");
});

module.exports = { getModels, getModelBySlug };
