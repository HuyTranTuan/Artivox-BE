const authService = require("@services/auth.service");
const catchAsync = require("@utils/catchAsync");

/////////// Admin Auth ///////////////
const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.adminLogin(email, password);
  return res.success(data, "Login successful");
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

module.exports = { adminLogin, customerRegister, customerLogin, refreshToken };
