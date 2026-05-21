const express = require("express");
const authController = require("@controllers/auth.controller");
const { validateMiddleware } = require("@middlewares/validate.middleware");
const { loginSchema, registerSchema } = require("@validators/auth.validator");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// Admin auth
router.post("/admin/login", validateMiddleware({ body: loginSchema }), authController.adminLogin);

// User auth
router.post("/customer/register", validateMiddleware({ body: registerSchema }), authController.customerRegister);
router.post("/customer/login", validateMiddleware({ body: loginSchema }), authController.customerLogin);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

// Logout - works for both admin and customer
router.post("/logout", authMiddleware, authController.logout);

// Update account information
router.patch("/admin/account", authMiddleware, authController.updateAdminAccount);
router.patch("/customer/account", authMiddleware, authController.updateCustomerAccount);

// Verify email
router.get("/verify-email", authController.verifyEmail);

module.exports = router;
