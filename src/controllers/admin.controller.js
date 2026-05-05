const adminService = require("@services/admin.service");
const catchAsync = require("@utils/catchAsync");

const getAdminUsers = catchAsync(async (req, res) => {
  const data = await adminService.getAdminUsers();
  return res.success(data, "Admin users fetched");
});

const getCustomers = catchAsync(async (req, res) => {
  const data = await adminService.getCustomers();
  return res.success(data, "Customers fetched");
});

const getAllOrders = catchAsync(async (req, res) => {
  const data = await adminService.getAllOrders(req.query);
  return res.success(data, "Orders fetched");
});

const getAdminRevenue = catchAsync(async (req, res) => {
  const data = await adminService.getAdminRevenue();
  return res.success(data, "Revenue fetched");
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { status, assignedAdminId } = req.body;
  const data = await adminService.updateOrderStatus(req.params.id, status, assignedAdminId);
  return res.success(data, "Order updated");
});

module.exports = { getAdminUsers, getCustomers, getAllOrders, getAdminRevenue, updateOrderStatus };
