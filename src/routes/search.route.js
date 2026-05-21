const express = require("express");
const searchController = require("@controllers/search.controller");
const validateQuery = require("@middlewares/validateQuery");
const { globalSearchSchema, modelsSearchSchema, materialsSearchSchema, toolsSearchSchema } = require("@validators/search.validator");

const router = express.Router();

/**
 * Global search endpoint
 * GET /search?q=<query>&limit=<limit>&type=<type>
 */
router.get("/", validateQuery(globalSearchSchema), searchController.globalSearch);

/**
 * Search models endpoint
 * GET /search/models?q=<query>&page=<page>&limit=<limit>&...filters
 */
router.get("/models", validateQuery(modelsSearchSchema), searchController.searchModels);

/**
 * Search materials endpoint
 * GET /search/materials?q=<query>&page=<page>&limit=<limit>&...filters
 */
router.get("/materials", validateQuery(materialsSearchSchema), searchController.searchMaterials);

/**
 * Search tools endpoint
 * GET /search/tools?q=<query>&page=<page>&limit=<limit>&...filters
 */
router.get("/tools", validateQuery(toolsSearchSchema), searchController.searchTools);

module.exports = router;
