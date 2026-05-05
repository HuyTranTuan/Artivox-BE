const orderService = require("@services/order.service");
const catchAsync = require("@utils/catchAsync");

// Create order
const createOrder = catchAsync(async (req, res) => {
  const data = await orderService.createOrder(req.user.id, req.body);
  return res.success(data, "Order created", 201);
});

// Get my orders
const getMyOrders = catchAsync(async (req, res) => {
  const data = await orderService.getMyOrders(req.user.id);
  return res.success(data, "Orders fetched");
});

// Cancel order
const cancelOrder = catchAsync(async (req, res) => {
  const data = await orderService.cancelOrder(req.params.id, req.user.id);
  return res.success(data, "Order cancelled");
});

module.exports = { createOrder, getMyOrders, cancelOrder };
