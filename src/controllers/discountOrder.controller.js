const discountOrderService = require("@services/discountOrder.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all discount orders
const getDiscountOrders = catchAsync(async (req, res) => {
  const data = await discountOrderService.getDiscountOrders();
  return res.success(data, "Discount orders fetched");
});

// Fetch a single discount order by id
const getDiscountOrderById = catchAsync(async (req, res) => {
  const data = await discountOrderService.getDiscountOrderById(req.params.id);
  if (!data) return res.notFound();
  return res.success(data, "Discount order detail fetched");
});

module.exports = { getDiscountOrders, getDiscountOrderById };
