const modelsService = require("@services/models.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");

// Fetch all model products
const getModels = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
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
  const query = {};
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  const data = await modelsService.getModelBySlug(req.params.slug, query);
  if (!data) return res.notFound();
  return res.success(data, "Model detail fetched");
});

const createModel = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  if (req.user && req.user.role === "STAFF") {
    bodyData.isActive = false;
  }
  const data = await modelsService.createModel(bodyData, req.files);
  return res.success(data, "Model created");
});

const updateModel = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  if (req.user && req.user.role === "STAFF") {
    delete bodyData.isActive;
  }
  const data = await modelsService.updateModel(req.params.slug, bodyData, req.files);
  if (!data) return res.notFound();
  return res.success(data, "Model updated");
});

const deleteModel = catchAsync(async (req, res) => {
  const data = await modelsService.deleteModel(req.params.slug);
  if (!data) return res.notFound();
  return res.success(null, "Model deleted successfully");
});

module.exports = { getModels, getModelBySlug, createModel, updateModel, deleteModel };
