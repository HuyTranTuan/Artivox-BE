const express = require("express");
const materialController = require("@controllers/material.controller");

const router = express.Router();

router.get("/", materialController.getMaterials);
router.get("/:slug", materialController.getMaterialBySlug);

module.exports = router;
