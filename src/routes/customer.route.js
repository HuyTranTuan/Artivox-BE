const express = require("express");
const customerController = require("@controllers/customer.controller");

const router = express.Router();

router.get("/", customerController.getCustomers);
router.get("/:slug", customerController.getCustomerBySlug);

module.exports = router;