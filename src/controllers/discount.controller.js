const discountService = require("@services/discount.service");
const catchAsync = require("@utils/catchAsync");

const getDiscounts = catchAsync(async (req, res) => {
  const data = await discountService.getDiscounts();
  return res.success(data, "Discounts fetched");
});

const getDiscountsAdmin = catchAsync(async (req, res) => {
  const data = await discountService.getDiscountsAdmin();
  return res.success(data, "All discounts fetched");
});

const getDiscountBySlug = catchAsync(async (req, res) => {
  const data = await discountService.getDiscountBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Discount detail fetched");
});

const createDiscount = catchAsync(async (req, res) => {
  const data = await discountService.createDiscount(req.body);
  return res.success(data, "Discount created");
});

const updateDiscount = catchAsync(async (req, res) => {
  const data = await discountService.updateDiscount(req.params.slug, req.body);
  if (!data) return res.notFound();
  return res.success(data, "Discount updated");
});

const deleteDiscount = catchAsync(async (req, res) => {
  const data = await discountService.deleteDiscount(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Discount deactivated");
});

module.exports = {
  getDiscounts,
  getDiscountsAdmin,
  getDiscountBySlug,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};
