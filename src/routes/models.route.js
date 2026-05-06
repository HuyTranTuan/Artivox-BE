const express = require("express");
const modelsController = require("@controllers/models.controller");

const router = express.Router();

router.get("/", modelsController.getModels);
router.get("/:slug", modelsController.getModelBySlug);

module.exports = router;