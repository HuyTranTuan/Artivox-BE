const authService = require("@services/auth.service");
const catchAsync = require("@utils/catchAsync");
const { HTTP_CODES } = require("@config/constants");

/////////// Admin Auth ///////////////
const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.adminLogin(email, password);
  return res.success(data, "Login successful");
});

const adminCreateStaff = catchAsync(async (req, res) => {
  const { email, password, fullName, phone, address } = req.body;
  const data = await authService.adminCreate(email, password, fullName, phone, address);
  return res.success(data, "Created Successed!", HTTP_CODES.CREATED);
});

///////////// User Auth //////////////
const customerRegister = catchAsync(async (req, res) => {
  const data = await authService.customerRegister(req.body);
  return res.success(data, "Registration successful", 201);
});

const customerLogin = catchAsync(async (req, res) => {
  const data = await authService.customerLogin(req.body.email, req.body.password);
  return res.success(data, "Login successful");
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const data = await authService.refreshToken(refreshToken);
  return res.success(data, "Token refreshed");
});

module.exports = { adminLogin, adminCreateStaff, customerRegister, customerLogin, refreshToken };
