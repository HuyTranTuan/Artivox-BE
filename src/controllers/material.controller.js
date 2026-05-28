const materialService = require("@services/material.service");
const catchAsync = require("@utils/catchAsync");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");

// Fetch all material products
const getMaterials = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
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
  const query = {};
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  const data = await materialService.getMaterialBySlug(req.params.slug, query);
  if (!data) return res.notFound();
  return res.success(data, "Material detail fetched");
});

const createMaterial = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  if (req.user && req.user.role === "STAFF") {
    bodyData.isActive = false;
  }
  const data = await materialService.createMaterial(bodyData, req.files);
  return res.success(data, "Material created");
});

const updateMaterial = catchAsync(async (req, res) => {
  const bodyData = { ...req.body };
  if (req.user && req.user.role === "STAFF") {
    delete bodyData.isActive;
  }
  const data = await materialService.updateMaterial(req.params.slug, bodyData, req.files);
  if (!data) return res.notFound();
  return res.success(data, "Material updated");
});

const deleteMaterial = catchAsync(async (req, res) => {
  const data = await materialService.deleteMaterial(req.params.slug);
  if (!data) return res.notFound();
  return res.success(null, "Material deleted successfully");
});

module.exports = { getMaterials, getMaterialBySlug, createMaterial, updateMaterial, deleteMaterial };
