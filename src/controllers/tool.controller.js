const toolService = require("@services/tool.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all tool products
const getTools = catchAsync(async (req, res) => {
  const data = await toolService.getTools();
  return res.success(data, "Tools fetched");
});

// Fetch a single tool product by slug
const getToolBySlug = catchAsync(async (req, res) => {
  const data = await toolService.getToolBySlug(req.params.slug);
  if (!data) throw new AppError("Tool not found", 404);
  return res.success(data, "Tool detail fetched");
});

module.exports = { getTools, getToolBySlug };
