const express = require("express");
const productController = require("@controllers/product.controller");
const { authMiddleware, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { cacheMiddleware } = require("@middlewares/cache.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, cacheMiddleware("products", 300), productController.getProducts);
router.get("/:slug", optionalAuthMiddleware, cacheMiddleware("product", 300), productController.getProductBySlug);

router.patch("/:id", authMiddleware, productController.updateProduct);

router.post("/:slug/rate", authMiddleware, productController.rateProduct);

module.exports = router;
