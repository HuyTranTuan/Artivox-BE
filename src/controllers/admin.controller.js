const { HTTP_CODES } = require("@/config/constants");
const adminService = require("@services/admin.service");
const catchAsync = require("@utils/catchAsync");

const getAdminDashboard = catchAsync(async (req, res) => {
  const data = await adminService.getAdminDashboard();
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const getAdminUsers = catchAsync(async (req, res) => {
  const data = await adminService.getAdminUsers();
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const getCustomers = catchAsync(async (req, res) => {
  const data = await adminService.getCustomers();
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const getCustomer = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const data = await adminService.getCustomer(slug);
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const getCustomerBanned = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const data = await adminService.getCustomerBanned(slug);
  return res.success(data, "Updated Successfully!", HTTP_CODES.OK);
});

const getAllOrders = catchAsync(async (req, res) => {
  const data = await adminService.getAllOrders(req.query);
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const getAdminRevenue = catchAsync(async (req, res) => {
  const data = await adminService.getAdminRevenue();
  return res.success(data, "Successed!", HTTP_CODES.OK);
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { status, assignedAdminId } = req.body;
  const data = await adminService.updateOrderStatus(req.params.id, status, assignedAdminId);
  return res.success(data, "Update Successed!", HTTP_CODES.OK);
});

const createStaff = catchAsync(async (req, res) => {
  const { email, password, fullName, phone, address } = req.body;
  const data = await adminService.createStaff(email, password, fullName, phone, address);
  return res.success(data, "Created Successed!", HTTP_CODES.CREATED);
});

const decentralizeStaff = catchAsync(async (req, res) => {
  const { email } = req.params;
  const { create, update, del } = req.bopdy;
  const data = await adminService.decentralizeStaff(email, create, update, del);
  return res.success(data, "Updated Successed!", HTTP_CODES.OK);
});

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getCustomers,
  getCustomer,
  getCustomerBanned,
  getAllOrders,
  getAdminRevenue,
  updateOrderStatus,
  createStaff,
  decentralizeStaff,
};
