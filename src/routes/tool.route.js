const express = require("express");
const toolController = require("@controllers/tool.controller");

const router = express.Router();

router.get("/", toolController.getTools);
router.get("/:slug", toolController.getToolBySlug);

module.exports = router;
