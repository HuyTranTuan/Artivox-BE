const express = require("express");
const productController = require("@controllers/product.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

router.patch("/:id", authMiddleware, productController.updateProduct);

router.post("/:slug/rate", authMiddleware, productController.rateProduct);

module.exports = router;
