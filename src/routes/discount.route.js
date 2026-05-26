const express = require("express");
const discountController = require("@controllers/discount.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public
router.get("/", discountController.getDiscounts);

// Admin/Staff protected — must be before /:slug
router.get("/admin", authMiddleware, restrictTo("ADMIN", "STAFF"), discountController.getDiscountsAdmin);

router.get("/:slug", discountController.getDiscountBySlug);

// Admin/Staff protected
router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", discountController.createDiscount);
router.put("/:slug", discountController.updateDiscount);
router.delete("/:slug", discountController.deleteDiscount);

module.exports = router;