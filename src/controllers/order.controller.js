const orderService = require("@services/order.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

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

// Fetch all orders (public)
const getAllOrders = catchAsync(async (req, res) => {
  const data = await orderService.getAllOrders();
  return res.success(data, "Orders fetched");
});

// Fetch a single order by id (public)
const getOrderById = catchAsync(async (req, res) => {
  const data = await orderService.getOrderById(req.params.id);
  if (!data) throw new AppError("Order not found", 404);
  return res.success(data, "Order detail fetched");
});

module.exports = { createOrder, getMyOrders, cancelOrder, getAllOrders, getOrderById };
