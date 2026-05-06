const express = require("express");
const orderController = require("@controllers/order.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);

// Protected routes
router.use(authMiddleware);
router.post("/", orderController.createOrder);
router.get("/me", orderController.getMyOrders);
router.post("/:id/cancel", orderController.cancelOrder);

module.exports = router;