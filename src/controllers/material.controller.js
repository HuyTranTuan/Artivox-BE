const materialService = require("@services/material.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all material products
const getMaterials = catchAsync(async (req, res) => {
  const data = await materialService.getMaterials();
  return res.success(data, "Materials fetched");
});

module.exports = { getMaterials };
