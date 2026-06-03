const express = require("express");
const toolController = require("@controllers/tool.controller");
const { authMiddleware, restrictTo, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");
const { cacheMiddleware } = require("@middlewares/cache.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, cacheMiddleware("tools", 300), toolController.getTools);
router.get("/:slug", optionalAuthMiddleware, cacheMiddleware("tool", 300), toolController.getToolBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, toolController.createTool);
router.put("/:slug", uploadProductImages, toolController.updateTool);
router.delete("/:slug", toolController.deleteTool);

module.exports = router;
