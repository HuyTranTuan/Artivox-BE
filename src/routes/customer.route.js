const express = require("express");
const customerController = require("@controllers/customer.controller");

const router = express.Router();

router.get("/", customerController.getCustomers);
router.patch("/:id/update", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);
router.get("/:slug", customerController.getCustomerBySlug);
router.get("/id/:id", customerController.getCustomerById);

module.exports = router;