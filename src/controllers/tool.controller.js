const toolService = require("@services/tool.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all tool products
const getTools = catchAsync(async (req, res) => {
  const data = await toolService.getTools();
  return res.success(data, "Tools fetched");
});

// Fetch a single tool product by slug
const getToolBySlug = catchAsync(async (req, res) => {
  const data = await toolService.getToolBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Tool detail fetched");
});

module.exports = { getTools, getToolBySlug };
