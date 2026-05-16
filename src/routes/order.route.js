const express = require("express");
const orderController = require("@controllers/order.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", orderController.getAllOrders);
router.get("/:orderId", orderController.getOrderById);

// Protected routes
router.use(authMiddleware);
router.post("/", orderController.createOrder);
router.get("/me", orderController.getMyOrders);
router.post("/:orderId/cancel", orderController.cancelOrder);
router.patch("/:orderId/approve", orderController.approveOrder);

module.exports = router;
