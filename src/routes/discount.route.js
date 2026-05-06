const express = require("express");
const discountController = require("@controllers/discount.controller");

const router = express.Router();

router.get("/", discountController.getDiscounts);
router.get("/:slug", discountController.getDiscountBySlug);

module.exports = router;