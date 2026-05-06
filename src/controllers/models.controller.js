const modelsService = require("@services/models.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all model products
const getModels = catchAsync(async (req, res) => {
  const data = await modelsService.getModels();
  return res.success(data, "Models fetched");
});

// Fetch a single model product by slug
const getModelBySlug = catchAsync(async (req, res) => {
  const data = await modelsService.getModelBySlug(req.params.slug);
  if (!data) throw new AppError("Model not found", 404);
  return res.success(data, "Model detail fetched");
});

module.exports = { getModels, getModelBySlug };