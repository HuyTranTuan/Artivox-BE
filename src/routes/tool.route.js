const express = require("express");
const toolController = require("@controllers/tool.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

router.get("/", toolController.getTools);
router.get("/:slug", toolController.getToolBySlug);

router.use(authMiddleware, restrictTo("ADMIN", "STAFF"));
router.post("/", uploadProductImages, toolController.createTool);
router.put("/:slug", uploadProductImages, toolController.updateTool);

module.exports = router;
