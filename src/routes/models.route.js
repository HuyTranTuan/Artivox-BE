const express = require("express");
const modelsController = require("@controllers/models.controller");
const { authMiddleware, restrictTo, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, modelsController.getModels);
router.get("/:slug", optionalAuthMiddleware, modelsController.getModelBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, modelsController.createModel);
router.put("/:slug", uploadProductImages, modelsController.updateModel);
router.delete("/:slug", modelsController.deleteModel);

module.exports = router;
