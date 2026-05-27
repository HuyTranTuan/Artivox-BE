const toolService = require("@services/tool.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");

// Fetch all tool products
const getTools = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await toolService.getTools(query);

  return res.paginatedSuccess(
    data.items,
    {
      total: data.total,
      limit: data.limit,
      skip: data.skip,
    },
    "Tools fetched",
  );
});

// Fetch a single tool product by slug
const getToolBySlug = catchAsync(async (req, res) => {
  const data = await toolService.getToolBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Tool detail fetched");
});

const createTool = catchAsync(async (req, res) => {
  const data = await toolService.createTool(req.body, req.files);
  return res.success(data, "Tool created");
});

const updateTool = catchAsync(async (req, res) => {
  const data = await toolService.updateTool(req.params.slug, req.body, req.files);
  if (!data) return res.notFound();
  return res.success(data, "Tool updated");
});

const deleteTool = catchAsync(async (req, res) => {
  const data = await toolService.deleteTool(req.params.slug);
  if (!data) return res.notFound();
  return res.success(null, "Tool deleted successfully");
});

module.exports = { getTools, getToolBySlug, createTool, updateTool, deleteTool };
