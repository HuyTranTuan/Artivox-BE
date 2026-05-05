const express = require("express");
const toolController = require("@controllers/tool.controller");

const router = express.Router();

router.get("/", toolController.getTools);

module.exports = router;
