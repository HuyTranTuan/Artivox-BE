const authService = require("@services/auth.service");
const catchAsync = require("@utils/catchAsync");
const isProduction = require("@utils/isProduction");

function writeRefreshTokenCookie(res, refreshToken) {
  if (!refreshToken) return;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? "none" : "lax",
    path: "/",
  });
}

function sendAuthResponse(res, payload, message, statusCode = 200) {
  writeRefreshTokenCookie(res, payload.refreshToken);

  return res.status(statusCode).json({
    status: "success",
    message,
    ...payload,
    data: payload,
  });
}

/////////// Admin Auth ///////////////
const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.adminLogin(email, password);
  return sendAuthResponse(res, data, "Login successful");
});

///////////// User Auth //////////////
const customerRegister = catchAsync(async (req, res) => {
  const data = await authService.customerRegister(req.body);
  return sendAuthResponse(res, data, "Registration successful", 201);
});

const customerLogin = catchAsync(async (req, res) => {
  const data = await authService.customerLogin(req.body.email, req.body.password);
  return sendAuthResponse(res, data, "Login successful");
});

const refreshToken = catchAsync(async (req, res) => {
  const token = authService.extractRefreshToken(req);
  const data = await authService.refreshToken(token);
  return sendAuthResponse(res, data, "Token refreshed");
});

// Logout - works for both admin and customer
const logout = catchAsync(async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? "none" : "lax",
    path: "/",
  });
  const data = await authService.logout(req.user.id, req.user.type);
  return res.success(data, "Logged out successfully");
});

// Update admin account
const updateAdminAccount = catchAsync(async (req, res) => {
  const data = await authService.updateAdminAccount(req.user.id, req.body);
  return res.success(data, "Account updated successfully");
});

// Update customer account
const updateCustomerAccount = catchAsync(async (req, res) => {
  const data = await authService.updateCustomerAccount(req.user.id, req.body);
  return res.success(data, "Account updated successfully");
});

// Verify email
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  const data = await authService.verifyEmail(token);
  return res.success(data, data.message);
});

// Resend verify email
const resendVerifyEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ status: "error", message: "Email is required" });
  }
  const data = await authService.resendVerifyEmail(email);
  return res.success(data, data.message);
});

module.exports = {
  adminLogin,
  customerRegister,
  customerLogin,
  refreshToken,
  logout,
  updateAdminAccount,
  updateCustomerAccount,
  verifyEmail,
  resendVerifyEmail,
};
