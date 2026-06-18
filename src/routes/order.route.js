const express = require("express");
const orderController = require("@controllers/order.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", orderController.getAllOrders);

// Protected routes
router.use(authMiddleware);
router.post("/", orderController.createOrder);
router.get("/me", orderController.getMyOrders);
router.post("/:orderNumber/cancel", orderController.cancelOrder);
router.patch("/:orderNumber/approve", orderController.approveOrder);
router.patch("/:orderNumber/payment-status", orderController.updateOrderPaymentStatus);
router.get("/number/:orderNumber", orderController.getOrderByNumber);
router.patch("/number/:orderNumber/status", orderController.updateOrderStatus);
router.get("/:orderNumber", orderController.getOrderById);

module.exports = router;
