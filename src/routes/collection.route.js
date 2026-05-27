const express = require("express");
const collectionController = require("@controllers/collection.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

// Public
router.get("/", collectionController.getCollections);
router.get("/:slug", collectionController.getCollectionBySlug);

// Admin/Staff protected
router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.get("/admin/all", collectionController.getCollectionsAdmin);
router.post("/", uploadProductImages, collectionController.createCollection);
router.put("/:slug", uploadProductImages, collectionController.updateCollection);
router.delete("/:slug", collectionController.deleteCollection);
router.post("/:id/products", collectionController.addProductToCollection);
router.delete("/:id/products/:productId", collectionController.removeProductFromCollection);

module.exports = router;
