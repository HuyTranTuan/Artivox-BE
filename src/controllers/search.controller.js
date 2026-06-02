const searchService = require("@services/search.service");
const catchAsync = require("@utils/catchAsync");
const { HTTP_CODES } = require("@/config/constants");

/**
 * Global search across all product types
 * GET /search?q=<query>&limit=<limit>&type=<type>
 */
const globalSearch = catchAsync(async (req, res) => {
  const { q, limit, type } = req.query;

  if (!q) {
    return res.error("Search query 'q' is required", HTTP_CODES.BAD_REQUESTED);
  }

  const data = await searchService.searchGlobal(q, limit, type);
  return res.success(data, "Global search results");
});

/**
 * Search models with filters and pagination
 * GET /search/models?q=<query>&page=<page>&limit=<limit>&...filters
 */
const searchModels = catchAsync(async (req, res) => {
  const { q, page, limit, collectionId, sortBy, sortOrder, minPrice, maxPrice } = req.query;

  if (!q) {
    return res.error("Search query 'q' is required", HTTP_CODES.BAD_REQUESTED);
  }

  const filters = {};
  if (collectionId) filters.collectionId = parseInt(collectionId);
  if (minPrice !== undefined) filters.minPrice = parseFloat(minPrice);
  if (maxPrice !== undefined) filters.maxPrice = parseFloat(maxPrice);

  const data = await searchService.searchModels(q, filters, page || 1, limit || 20, sortBy || "newest", sortOrder || "desc");

  return res.success(data, "Models search results");
});

/**
 * Search materials with filters and pagination
 * GET /search/materials?q=<query>&page=<page>&limit=<limit>&...filters
 */
const searchMaterials = catchAsync(async (req, res) => {
  const { q, page, limit, collectionId, materialType, color, sortBy, sortOrder, minPrice, maxPrice } = req.query;

  if (!q) {
    return res.error("Search query 'q' is required", HTTP_CODES.BAD_REQUESTED);
  }

  const filters = {};
  if (collectionId) filters.collectionId = parseInt(collectionId);
  if (materialType) filters.materialType = materialType;
  if (color) filters.color = color;
  if (minPrice !== undefined) filters.minPrice = parseFloat(minPrice);
  if (maxPrice !== undefined) filters.maxPrice = parseFloat(maxPrice);

  const data = await searchService.searchMaterials(q, filters, page || 1, limit || 20, sortBy || "newest", sortOrder || "desc");

  return res.success(data, "Materials search results");
});

/**
 * Search tools with filters and pagination
 * GET /search/tools?q=<query>&page=<page>&limit=<limit>&...filters
 */
const searchTools = catchAsync(async (req, res) => {
  const { q, page, limit, collectionId, sortBy, sortOrder, minPrice, maxPrice } = req.query;

  if (!q) {
    return res.error("Search query 'q' is required", HTTP_CODES.BAD_REQUESTED);
  }

  const filters = {};
  if (collectionId) filters.collectionId = parseInt(collectionId);
  if (minPrice !== undefined) filters.minPrice = parseFloat(minPrice);
  if (maxPrice !== undefined) filters.maxPrice = parseFloat(maxPrice);

  const data = await searchService.searchTools(q, filters, page || 1, limit || 20, sortBy || "newest", sortOrder || "desc");

  return res.success(data, "Tools search results");
});

module.exports = {
  globalSearch,
  searchModels,
  searchMaterials,
  searchTools,
};
