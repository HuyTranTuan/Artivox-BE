const express = require("express");
const productController = require("@controllers/product.controller");
const { validateMiddleware } = require("@middlewares/validate.middleware");
const { productQuerySchema } = require("@validators/catalog.validator");

const router = express.Router();

router.get("/", validateMiddleware({ query: productQuerySchema }), productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

module.exports = router;
