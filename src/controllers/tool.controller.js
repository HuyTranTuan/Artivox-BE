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

module.exports = { getTools, getToolBySlug };
