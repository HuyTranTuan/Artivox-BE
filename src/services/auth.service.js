const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("@libs/prisma");
const { jwtSecret, jwtRefreshSecret, accessTokenTTL, refreshTokenTTL } = require("@config/auth");
const slugify = require("@/utils/slugify");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@/utils/AppError");

function generateTokens(payload) {
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: accessTokenTTL,
  });
  const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: refreshTokenTTL,
  });
  return { accessToken, refreshToken, expiresIn: accessTokenTTL };
}

// Admin login
async function adminLogin(email, password) {
  const user = await prisma.adminUser.findFirst({
    where: { email, deletedAt: null },
  });
  if (!user) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);
  if (user.deletedAt) throw new AppError("Account deactivated", HTTP_CODES.FORBIDDEN);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", HTTP_CODES.UNAUTHORIZED);

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    type: "admin",
  });

  const result = {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
  return result;
}

// Customer register
async function customerRegister({ email, password, fullName, phone, address }) {
  const existing = await prisma.customer.findFirst({ where: { email } });
  if (existing) throw new AppError("Email already registered", HTTP_CODES.CONFLICT);

  const hashedPassword = await bcrypt.hash(password, 12);
  const slug = slugify(fullName || email.split("@")[0]) + "-" + Date.now().toString(36);

  const user = await prisma.customer.create({
    data: { email, password: hashedPassword, fullName, phone, address, slug },
  });

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
    },
  };
}

// Customer login
async function customerLogin(email, password) {
  const user = await prisma.customer.findFirst({
    where: { email, deletedAt: null },
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
    },
  };
}

// Refresh token
async function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, jwtRefreshSecret);
    const { iat, exp, ...payload } = decoded;

    // Verify user still exists
    if (payload.type === "admin") {
      const user = await prisma.adminUser.findFirst({
        where: { email: payload.email, deletedAt: null },
      });
      if (!user) throw new AppError("Not found", HTTP_CODES.NOT_FOUND);
    } else {
      const user = await prisma.customer.findFirst({
        where: { email: payload.email, deletedAt: null },
      });
      if (!user) throw new AppError("Not found", HTTP_CODES.NOT_FOUND);
    }

    return generateTokens(payload);
  } catch (error) {
    if (error.isOperational) throw new AppError("Failed", HTTP_CODES.INTERNAL_SERVER_ERROR);
    throw new AppError("Invalid refreshtoken", HTTP_CODES.UNAUTHORIZED);
  }
}

module.exports = {
  adminLogin,
  customerRegister,
  customerLogin,
  refreshToken,
};
