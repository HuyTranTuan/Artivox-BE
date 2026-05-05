const express = require("express");
const collectionRoute = require("@routes/collection.route");
const productRoute = require("@routes/product.route");
const materialRoute = require("@routes/material.route");
const toolRoute = require("@routes/tool.route");

const router = express.Router();

router.use("/collections", collectionRoute);
router.use("/products", productRoute);
router.use("/materials", materialRoute);
router.use("/tools", toolRoute);

module.exports = router;
