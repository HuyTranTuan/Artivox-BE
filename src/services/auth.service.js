const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("@libs/prisma");
const { jwtSecret, jwtRefreshSecret, accessTokenTTL, refreshTokenTTL } = require("@config/auth");
const AppError = require("@utils/AppError");

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: accessTokenTTL });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshTokenTTL });
  return { accessToken, refreshToken, expiresIn: 3600 };
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Admin login
async function adminLogin(email, password) {
  const user = await prisma.adminUser.findFirst({ where: { email, deletedAt: null } });
  if (!user) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account deactivated", 403);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const tokens = generateTokens({ id: user.id, email: user.email, role: user.role, type: "admin" });
  return { ...tokens, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, slug: user.slug } };
}

// Customer register
async function customerRegister({ email, password, fullName, phone, address }) {
  const existing = await prisma.customer.findFirst({ where: { email } });
  if (existing) throw new AppError("Email already registered", 409);

  const hashedPassword = await bcrypt.hash(password, 12);
  const slug = slugify(fullName || email.split("@")[0]) + "-" + Date.now().toString(36);

  const user = await prisma.customer.create({
    data: { email, password: hashedPassword, fullName, phone, address, slug },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, type: "customer" });
  return { ...tokens, user: { id: user.id, email: user.email, fullName: user.fullName, slug: user.slug } };
}

// Customer login
async function customerLogin(email, password) {
  const user = await prisma.customer.findFirst({ where: { email, deletedAt: null } });
  if (!user) throw new AppError("Invalid credentials", 401);
  if (!user.isActive) throw new AppError("Account deactivated", 403);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const tokens = generateTokens({ id: user.id, email: user.email, type: "customer" });
  return { ...tokens, user: { id: user.id, email: user.email, fullName: user.fullName, slug: user.slug } };
}

// Refresh token
async function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, jwtRefreshSecret);
    const { iat, exp, ...payload } = decoded;

    // Verify user still exists
    if (payload.type === "admin") {
      const user = await prisma.adminUser.findFirst({ where: { id: payload.id, deletedAt: null, isActive: true } });
      if (!user) throw new AppError("User not found", 401);
    } else {
      const user = await prisma.customer.findFirst({ where: { id: payload.id, deletedAt: null, isActive: true } });
      if (!user) throw new AppError("User not found", 401);
    }

    return generateTokens(payload);
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError("Invalid refresh token", 401);
  }
}

module.exports = { adminLogin, customerRegister, customerLogin, refreshToken };
