const express = require("express");
const passport = require("@config/passport");
const jwt = require("jsonwebtoken");
const authController = require("@controllers/auth.controller");
const { validateMiddleware } = require("@middlewares/validate.middleware");
const { loginSchema, registerSchema } = require("@validators/auth.validator");
const { authMiddleware } = require("@middlewares/auth.middleware");
const { authLimiter } = require("@middlewares/ratelimit.middleware");
const { jwtSecret, jwtRefreshSecret, accessTokenTTL, refreshTokenTTL } = require("@config/auth");

const router = express.Router();

// Admin auth
router.post("/admin/login", authLimiter, validateMiddleware({ body: loginSchema }), authController.adminLogin);

// User auth
router.post("/customer/register", authLimiter, validateMiddleware({ body: registerSchema }), authController.customerRegister);
router.post("/customer/login", authLimiter, validateMiddleware({ body: loginSchema }), authController.customerLogin);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Logout - works for both admin and customer
router.post("/logout", authMiddleware, authController.logout);

// Update account information
router.patch("/admin/account", authMiddleware, authController.updateAdminAccount);
router.patch("/customer/account", authMiddleware, authController.updateCustomerAccount);

// Change password (requires current password)
router.patch("/admin/change-password", authMiddleware, authController.changeAdminPassword);
router.patch("/customer/change-password", authMiddleware, authController.changeCustomerPassword);

// Forgot / Reset password
router.post("/forgot-password", authLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Verify email
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verify-email", authController.resendVerifyEmail);

// Google OAuth
router.get("/customer/google", passport.authenticate("google-customer", { session: false, scope: ["profile", "email"] }));
router.get("/customer/google/callback",
  passport.authenticate("google-customer", { session: false, failureRedirect: `${process.env.FE_CUSTOMER_URL || "http://localhost:3000"}/auth/login?error=google_failed` }),
  (req, res) => {
    const user = req.user;
    const payload = { id: user.id, email: user.email, type: "customer" };
    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: accessTokenTTL });
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshTokenTTL });

    const feUrl = process.env.FE_CUSTOMER_URL || "http://localhost:3000";
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      user: JSON.stringify({
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        slug: user.slug,
        verified: true,
        avatar: user.avatar || "",
      }),
    });
    res.redirect(`${feUrl}/auth/google/callback?${params.toString()}`);
  }
);

module.exports = router;
