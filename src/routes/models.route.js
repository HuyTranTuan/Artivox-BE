const express = require("express");
const modelsController = require("@controllers/models.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

router.get("/", modelsController.getModels);
router.get("/:slug", modelsController.getModelBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, modelsController.createModel);
router.put("/:slug", uploadProductImages, modelsController.updateModel);

module.exports = router;