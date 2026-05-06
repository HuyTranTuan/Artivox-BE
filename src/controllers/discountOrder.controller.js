const discountOrderService = require("@services/discountOrder.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all discount orders
const getDiscountOrders = catchAsync(async (req, res) => {
  const data = await discountOrderService.getDiscountOrders();
  return res.success(data, "Discount orders fetched");
});

// Fetch a single discount order by id
const getDiscountOrderById = catchAsync(async (req, res) => {
  const data = await discountOrderService.getDiscountOrderById(req.params.id);
  if (!data) throw new AppError("Discount order not found", 404);
  return res.success(data, "Discount order detail fetched");
});

module.exports = { getDiscountOrders, getDiscountOrderById };