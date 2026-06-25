const express = require("express");
const modelsController = require("@controllers/models.controller");
const { authMiddleware, restrictTo, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");
const { cacheMiddleware } = require("@middlewares/cache.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, cacheMiddleware("models", 300), modelsController.getModels);
router.get("/:slug/presigned", modelsController.getPresignedModelUrl); // presigned 60s
router.get("/:slug", optionalAuthMiddleware, cacheMiddleware("model", 300), modelsController.getModelBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, modelsController.createModel);
router.put("/:slug", uploadProductImages, modelsController.updateModel);
router.delete("/:slug", modelsController.deleteModel);

module.exports = router;
