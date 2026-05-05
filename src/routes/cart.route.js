const express = require("express");
const cartController = require("@controllers/cart.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.patch("/:id", cartController.updateCartItem);
router.delete("/:id", cartController.removeFromCart);

module.exports = router;
