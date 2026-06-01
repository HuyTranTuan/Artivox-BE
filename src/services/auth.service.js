const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("@libs/prisma");
const { jwtSecret, jwtRefreshSecret, accessTokenTTL, refreshTokenTTL } = require("@config/auth");
const slugify = require("@/utils/slugify");
const { HTTP_CODES } = require("@/config/constants");
const BAD_REQUEST = HTTP_CODES.BAD_REQUESTED;
const AppError = require("@/utils/AppError");
const { sendVerificationEmail, sendResetPasswordEmail } = require("@services/mail.service");
const { uploadAvatarImage } = require("@services/image.service");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: accessTokenTTL,
  });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: refreshTokenTTL,
  });
  return { accessToken, refreshToken, expiresIn: accessTokenTTL };
}

function extractRefreshToken(req = {}) {
  const bodyToken = req?.body?.refreshToken;
  const cookieToken = req?.cookies?.refreshToken;
  const headerToken = req?.headers?.["x-refresh-token"];
  const authHeader = req?.headers?.authorization;
  const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  return bodyToken || cookieToken || headerToken || bearerToken || null;
}

const bcryptCostFactor = Number(process.env.BCRYPT_SALT) || 12;

// Admin login
async function adminLogin(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.adminUser.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });
  if (!user) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);
  if (user.deletedAt) throw new AppError("Account deactivated", HTTP_CODES.FORBIDDEN);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    permission: user.permission,
    type: "admin",
  });

  const result = {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permission: user.permission,
    },
  };
  return result;
}

// Customer register
async function customerRegister({ email, password, fullName, phone, address, gender }) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.customer.findFirst({ where: { email: normalizedEmail } });
  if (existing) throw new AppError("Email already registered", HTTP_CODES.CONFLICT);

  const hashedPassword = await bcrypt.hash(password, bcryptCostFactor);
  const slug = slugify(fullName || normalizedEmail.split("@")[0]) + "-" + Date.now().toString(36);

  // Generate verification token (random hex, expires 1h)
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  const user = await prisma.customer.create({
    data: { email: normalizedEmail, password: hashedPassword, fullName, phone, address, gender, slug, verificationToken, verificationTokenExpiry },
  });

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    type: "customer",
  });

  // Send verification email (non-blocking)
  sendVerificationEmail(normalizedEmail, verificationToken).catch((err) =>
    console.error("[Mail] Failed to send verification email:", err.message)
  );

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      slug: user.slug,
    },
  };
}

// Verify email by token
async function verifyEmail(token) {
  if (!token) throw new AppError("Token required", BAD_REQUEST);

  const customer = await prisma.customer.findFirst({
    where: { verificationToken: token, deletedAt: null },
  });

  if (!customer) throw new AppError("Invalid or expired token", BAD_REQUEST);
  if (customer.verifiedAt) return { message: "Email already verified" };
  if (customer.verificationTokenExpiry < new Date())
    throw new AppError("Token expired", BAD_REQUEST);

  await prisma.customer.update({
    where: { id: customer.id },
    data: { verifiedAt: new Date(), verificationToken: null, verificationTokenExpiry: null },
  });

  return { message: "Email verified successfully" };
}

// Customer login
async function customerLogin(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.customer.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });
  if (!user) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);
  if (user.deletedAt) throw new AppError("Account deactivated", HTTP_CODES.FORBIDDEN);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    type: "customer",
  });
  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      slug: user.slug,
      verified: user.verifiedAt,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      dob: user.dateOfBirth,
      avatar: user.avatar,
    },
  };
}

// Refresh token
async function refreshToken(token) {
  if (!token) {
    throw new AppError("Refresh token required", HTTP_CODES.BAD_REQUESTED);
  }

  try {
    const decoded = jwt.verify(token, jwtRefreshSecret);
    const { iat, exp, ...payload } = decoded;

    // Verify user still exists
    if (payload.type === "admin") {
      const user = await prisma.adminUser.findFirst({
        where: { id: payload.id, email: normalizeEmail(payload.email), deletedAt: null },
      });
      if (!user) throw new AppError("Not found", HTTP_CODES.NOT_FOUND);
      return generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        type: "admin",
      });
    } else {
      const user = await prisma.customer.findFirst({
        where: { id: payload.id, email: normalizeEmail(payload.email), deletedAt: null },
      });
      if (!user) throw new AppError("Not found", HTTP_CODES.NOT_FOUND);
      return generateTokens({
        id: user.id,
        email: user.email,
        type: "customer",
      });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError") {
      throw new AppError("Invalid refresh token", HTTP_CODES.UNAUTHORIZED);
    }
    throw new AppError("Failed to refresh token", HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
}

// Logout function (works for both admin and customer)
async function logout(userId, userType) {
  // In a real app, you might invalidate tokens by storing them in a blacklist (Redis)
  // For now, logout is handled client-side by removing tokens
  return { message: "Logout successful" };
}

// Update admin account information
async function updateAdminAccount(userId, { fullName, email, phone, address, avatar }) {
  userId = BigInt(userId);
  const user = await prisma.adminUser.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!user) throw new AppError("User not found", HTTP_CODES.NOT_FOUND);

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existing = await prisma.adminUser.findFirst({
      where: { email, deletedAt: null, NOT: { id: userId } },
    });
    if (existing) throw new AppError("Email already in use", HTTP_CODES.CONFLICT);
  }

  let finalAvatar = user.avatar;
  if (avatar) {
    finalAvatar = await uploadAvatarImage(avatar, userId, "admin");
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(finalAvatar && { avatar: finalAvatar }),
    },
  });

  return {
    id: updated.id.toString(),
    email: updated.email,
    fullName: updated.fullName,
    role: updated.role,
    phone: updated.phone,
    address: updated.address,
    avatar: updated.avatar,
  };
}

// Update customer account information
async function updateCustomerAccount(customerId, { fullName, email, phone, address, password, avatar }) {
  customerId = BigInt(customerId);
  const user = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
  });

  if (!user) throw new AppError("User not found", HTTP_CODES.NOT_FOUND);

  // Check if email is already taken by another user
  if (email && email !== user.email) {
    const existing = await prisma.customer.findFirst({
      where: { email, deletedAt: null, NOT: { id: customerId } },
    });
    if (existing) throw new AppError("Email already in use", HTTP_CODES.CONFLICT);
  }

  const slug = fullName ? slugify(fullName) + "-" + Date.now().toString(36) : user.slug;

  let finalAvatar = user.avatar;
  if (avatar && avatar.startsWith("data:image/")) {
    const uploaded = await uploadAvatarImage(avatar, customerId, "customer");
    if (uploaded && typeof uploaded === "string" && !uploaded.startsWith("data:")) {
      finalAvatar = uploaded;
    }
  }

  const updateData = {
    ...(fullName != null && fullName !== "" && { fullName }),
    ...(email != null && email !== "" && { email }),
    ...(phone != null && phone !== "" && { phone }),
    ...(address != null && { address }),
    ...(fullName != null && fullName !== "" && { slug }),
    ...(finalAvatar != null && finalAvatar !== user.avatar && { avatar: finalAvatar }),
  };
  if (password) {
    updateData.password = await bcrypt.hash(password, bcryptCostFactor);
  }

  // Nothing to update
  if (Object.keys(updateData).length === 0) {
    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      slug: user.slug,
      avatar: user.avatar,
    };
  }

  try {
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });
    return {
      id: updated.id.toString(),
      email: updated.email,
      fullName: updated.fullName,
      phone: updated.phone,
      address: updated.address,
      slug: updated.slug,
      avatar: updated.avatar,
    };
  } catch (err) {
    console.error("[updateCustomerAccount] Prisma error:", err.message, err.code, err.meta);
    throw err;
  }
}

// Change password (requires current password verification)
async function changeAdminPassword(userId, { currentPassword, newPassword }) {
  userId = BigInt(userId);
  const user = await prisma.adminUser.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new AppError("User not found", HTTP_CODES.NOT_FOUND);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", HTTP_CODES.UNAUTHORIZED);

  if (newPassword.length < 6) throw new AppError("Password must be at least 6 characters", BAD_REQUEST);

  const hashed = await bcrypt.hash(newPassword, bcryptCostFactor);
  await prisma.adminUser.update({ where: { id: userId }, data: { password: hashed } });
  return { message: "Password updated successfully" };
}

async function changeCustomerPassword(userId, { currentPassword, newPassword }) {
  userId = BigInt(userId);
  const user = await prisma.customer.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw new AppError("User not found", HTTP_CODES.NOT_FOUND);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError("Current password is incorrect", HTTP_CODES.UNAUTHORIZED);

  if (newPassword.length < 6) throw new AppError("Password must be at least 6 characters", BAD_REQUEST);

  const hashed = await bcrypt.hash(newPassword, bcryptCostFactor);
  await prisma.customer.update({ where: { id: userId }, data: { password: hashed } });
  return { message: "Password updated successfully" };
}

// Forgot password - send reset email
async function forgotPassword(email, userType = "customer") {
  const normalizedEmail = normalizeEmail(email);
  let user;

  if (userType === "admin") {
    user = await prisma.adminUser.findFirst({ where: { email: normalizedEmail, deletedAt: null } });
  } else {
    user = await prisma.customer.findFirst({ where: { email: normalizedEmail, deletedAt: null } });
  }

  // Always return success to avoid email enumeration
  if (!user) return { message: "If this email is registered, you will receive a password reset link." };

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  if (userType === "admin") {
    await prisma.adminUser.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
  } else {
    await prisma.customer.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
  }

  sendResetPasswordEmail(normalizedEmail, resetToken, userType).catch((err) =>
    console.error("[Mail] Failed to send reset password email:", err.message)
  );

  return { message: "If this email is registered, you will receive a password reset link." };
}

// Reset password by token
async function resetPassword(token, newPassword) {
  if (!token) throw new AppError("Token required", BAD_REQUEST);
  if (!newPassword || newPassword.length < 6) throw new AppError("Password must be at least 6 characters", BAD_REQUEST);

  const now = new Date();

  // Check admin first
  let user = await prisma.adminUser.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: now }, deletedAt: null },
  });

  if (user) {
    const hashed = await bcrypt.hash(newPassword, bcryptCostFactor);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });
    return { message: "Password reset successfully" };
  }

  // Check customer
  user = await prisma.customer.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: now }, deletedAt: null },
  });

  if (!user) throw new AppError("Invalid or expired reset token", BAD_REQUEST);

  const hashed = await bcrypt.hash(newPassword, bcryptCostFactor);
  await prisma.customer.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });
  return { message: "Password reset successfully" };
}

async function resendVerifyEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const customer = await prisma.customer.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  });

  if (!customer) throw new AppError("User not found", HTTP_CODES.NOT_FOUND);
  if (customer.verifiedAt) throw new AppError("Email already verified", HTTP_CODES.CONFLICT);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.customer.update({
    where: { id: customer.id },
    data: { verificationToken, verificationTokenExpiry },
  });

  sendVerificationEmail(normalizedEmail, verificationToken).catch((err) =>
    console.error("[Mail] Failed to resend verification email:", err.message)
  );

  return { message: "Verification email sent successfully" };
}

module.exports = {
  adminLogin,
  customerRegister,
  customerLogin,
  refreshToken,
  extractRefreshToken,
  logout,
  updateAdminAccount,
  updateCustomerAccount,
  changeAdminPassword,
  changeCustomerPassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerifyEmail,
};
