const express = require("express");
const toolController = require("@controllers/tool.controller");
const { authMiddleware, restrictTo, optionalAuthMiddleware } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, toolController.getTools);
router.get("/:slug", optionalAuthMiddleware, toolController.getToolBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, toolController.createTool);
router.put("/:slug", uploadProductImages, toolController.updateTool);
router.delete("/:slug", toolController.deleteTool);

module.exports = router;
