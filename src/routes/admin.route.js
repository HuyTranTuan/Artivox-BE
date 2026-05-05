const express = require("express");
const adminController = require("@controllers/admin.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");

const router = express.Router();
router.use(authMiddleware);
router.use(restrictTo("ADMIN", "MANAGER"));

router.get("/users", adminController.getAdminUsers);
router.get("/customers", adminController.getCustomers);
router.get("/orders", adminController.getAllOrders);
router.patch("/orders/:id", adminController.updateOrderStatus);
router.get("/revenue", adminController.getAdminRevenue);

module.exports = router;
