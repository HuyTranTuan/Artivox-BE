const express = require("express");
const authController = require("@controllers/auth.controller");
const { validateMiddleware } = require("@middlewares/validate.middleware");
const { loginSchema, registerSchema } = require("@validators/auth.validator");

const router = express.Router();

// Admin auth
router.post("/admin/login", validateMiddleware({ body: loginSchema }), authController.adminLogin);

// User auth
router.post("/customer/register", validateMiddleware({ body: registerSchema }), authController.customerRegister);
router.post("/customer/login", validateMiddleware({ body: loginSchema }), authController.customerLogin);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

module.exports = router;
