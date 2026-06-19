const express = require("express");
const shippingAddressController = require("@controllers/shippingAddress.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, shippingAddressController.getMyAddresses);
router.post("/", authMiddleware, shippingAddressController.createAddress);
router.patch("/:id/set-default", authMiddleware, shippingAddressController.setDefaultAddress);
router.patch("/:id", authMiddleware, shippingAddressController.updateAddress);
router.delete("/:id", authMiddleware, shippingAddressController.deleteAddress);

module.exports = router;
