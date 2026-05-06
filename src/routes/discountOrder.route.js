const express = require("express");
const discountOrderController = require("@controllers/discountOrder.controller");

const router = express.Router();

router.get("/", discountOrderController.getDiscountOrders);
router.get("/:id", discountOrderController.getDiscountOrderById);

module.exports = router;