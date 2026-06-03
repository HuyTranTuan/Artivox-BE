const express = require("express");
const materialController = require("@controllers/material.controller");
const { authMiddleware, restrictTo, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");
const { cacheMiddleware } = require("@middlewares/cache.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, cacheMiddleware("materials", 300), materialController.getMaterials);
router.get("/:slug", optionalAuthMiddleware, cacheMiddleware("material", 300), materialController.getMaterialBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, materialController.createMaterial);
router.put("/:slug", uploadProductImages, materialController.updateMaterial);
router.delete("/:slug", materialController.deleteMaterial);

module.exports = router;
