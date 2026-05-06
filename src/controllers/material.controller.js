const materialService = require("@services/material.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all material products
const getMaterials = catchAsync(async (req, res) => {
  const data = await materialService.getMaterials();
  return res.success(data, "Materials fetched");
});

// Fetch a single material product by slug
const getMaterialBySlug = catchAsync(async (req, res) => {
  const data = await materialService.getMaterialBySlug(req.params.slug);
  if (!data) throw new AppError("Material not found", 404);
  return res.success(data, "Material detail fetched");
});

module.exports = { getMaterials, getMaterialBySlug };
