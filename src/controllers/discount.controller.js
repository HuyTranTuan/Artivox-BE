const discountService = require("@services/discount.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all discounts
const getDiscounts = catchAsync(async (req, res) => {
  const data = await discountService.getDiscounts();
  return res.success(data, "Discounts fetched");
});

// Fetch a single discount by slug
const getDiscountBySlug = catchAsync(async (req, res) => {
  const data = await discountService.getDiscountBySlug(req.params.slug);
  if (!data) throw new AppError("Discount not found", 404);
  return res.success(data, "Discount detail fetched");
});

module.exports = { getDiscounts, getDiscountBySlug };