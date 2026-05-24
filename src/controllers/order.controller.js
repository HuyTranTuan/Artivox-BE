const { HTTP_CODES } = require("@/config/constants");
const orderService = require("@services/order.service");
const catchAsync = require("@utils/catchAsync");

// Create order
const createOrder = catchAsync(async (req, res) => {
  const userID = req.user.id;
  const body = req.body;
  const data = await orderService.createOrder(userID, body);
  
  // Emit to admins
  req.app.get("io").of("/notifications").to("admin_room").emit("new_order", {
    orderId: data.id.toString(),
    customerId: userID,
    total: data.totalAmount,
  });

  return res.success(data, "Order created", HTTP_CODES.CREATED);
});

// Get my orders
const getMyOrders = catchAsync(async (req, res) => {
  const userID = req.user.id;
  const data = await orderService.getMyOrders(userID);
  return res.success(data, "Orders fetched");
});

// Cancel order
const cancelOrder = catchAsync(async (req, res) => {
  const userID = req.user.id;
  const { orderId } = req.params;
  const data = await orderService.cancelOrder(orderId, userID);
  
  // Emit to client
  req.app.get("io").of("/chat").to(`chat:${userID}`).emit("order_status_updated", {
    orderId: data.id.toString(),
    status: data.status,
  });

  return res.success(data, "Order cancelled");
});

// Fetch all orders (public)
const getAllOrders = catchAsync(async (req, res) => {
  const data = await orderService.getAllOrders();
  return res.success(data, "Orders fetched");
});

// Fetch a single order by id (public)
const getOrderById = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const data = await orderService.getOrderById(orderId);
  if (!data) return res.notFound();
  return res.success(data, "Order detail fetched");
});

// Approve order
const approveOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const data = await orderService.approveOrder(orderId);
  if (!data) return res.notFound();
  
  // Emit to client
  req.app.get("io").of("/chat").to(`chat:${data.customerId}`).emit("order_status_updated", {
    orderId: data.id.toString(),
    status: data.status,
  });

  return res.success(data, "Order approved");
});

module.exports = { createOrder, getMyOrders, cancelOrder, getAllOrders, getOrderById, approveOrder };
