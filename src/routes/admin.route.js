const express = require("express");
const adminController = require("@controllers/admin.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { validateMiddleware } = require("@/middlewares/validate.middleware");
const { registerSchema } = require("@/validators/auth.validator");

const router = express.Router();
router.use(authMiddleware);
router.use(restrictTo("ADMIN"));

router.get("/dashboard", adminController.getAdminDashboard);
router.get("/users", adminController.getAdminUsers);
router.get("/customers", adminController.getCustomers);
router.get("/customers/:slug", adminController.getCustomer);
router.patch("/customers/:slug", adminController.getCustomerBanned);
router.get("/orders", adminController.getAllOrders);
router.patch("/orders/:id", adminController.updateOrderStatus);
router.get("/revenue", adminController.getAdminRevenue);

router.post("/staff-create", validateMiddleware({ body: registerSchema }), adminController.createStaff);
router.patch("/staff-decentralize/:email", adminController.decentralizeStaff);

module.exports = router;
