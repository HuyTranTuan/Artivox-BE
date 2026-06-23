const { HTTP_CODES } = require("@/config/constants");
const orderService = require("@services/order.service");
const catchAsync = require("@utils/catchAsync");
const { clearCache } = require("@middlewares/cache.middleware");

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

  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");

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
  const { orderNumber } = req.params;
  const data = await orderService.cancelOrder(orderNumber, userID);
  
  // Emit to client
  req.app.get("io").of("/chat").to(`chat:${userID}`).emit("order_status_updated", {
    orderId: data.id.toString(),
    status: data.status,
  });

  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");

  return res.success(data, "Order cancelled");
});

// Fetch all orders (public)
const getAllOrders = catchAsync(async (req, res) => {
  const data = await orderService.getAllOrders(req.query);
  return res.success(data, "Orders fetched");
});

// Fetch a single order by id (public)
const getOrderById = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const data = await orderService.getOrderById(orderNumber);
  if (!data) return res.notFound();
  return res.success(data, "Order detail fetched");
});

// Fetch a single order by orderNumber (public)
const getOrderByNumber = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const data = await orderService.getOrderByNumber(orderNumber);
  if (!data) return res.notFound();
  return res.success(data, "Order detail fetched");
});

// Update order status (admin/staff workflow)
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const { status } = req.body;
  const data = await orderService.updateOrderStatus(orderNumber, status);
  if (!data) return res.notFound();

  const io = req.app.get("io");
  // Notify admin room
  io.of("/notifications").to("admin_room").emit("order_status_updated", {
    orderId: data.id.toString(),
    orderNumber,
    status: data.status,
  });
  // Notify the customer so Ecommerce can update in real-time
  if (data.customerId) {
    io.of("/chat").to(`chat:${data.customerId}`).emit("order_status_updated", {
      orderId: data.id.toString(),
      orderNumber,
      status: data.status,
    });
  }

  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");

  return res.success(data, "Order status updated");
});

// Approve order
const approveOrder = catchAsync(async (req, res) => {
  const { orderNumber } = req.params;
  const data = await orderService.approveOrder(orderNumber);
  if (!data) return res.notFound();
  
  // Emit to client
  req.app.get("io").of("/chat").to(`chat:${data.customerId}`).emit("order_status_updated", {
    orderId: data.id.toString(),
    status: data.status,
  });

  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");

  return res.success(data, "Order approved");
});

// Update order payment status
const updateOrderPaymentStatus = catchAsync(async (req, res) => {
  const userID = req.user.id;
  const { orderNumber } = req.params;
  const { paymentStatus } = req.body;
  const data = await orderService.updateOrderPaymentStatus(orderNumber, userID, paymentStatus);
  
  // Emit to client
  req.app.get("io").of("/chat").to(`chat:${userID}`).emit("order_status_updated", {
    orderId: data.id.toString(),
    status: data.status,
    paymentStatus: data.paymentStatus,
  });

  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");

  return res.success(data, "Order payment status updated");
});

module.exports = { createOrder, getMyOrders, cancelOrder, getAllOrders, getOrderById, getOrderByNumber, updateOrderStatus, approveOrder, updateOrderPaymentStatus };

