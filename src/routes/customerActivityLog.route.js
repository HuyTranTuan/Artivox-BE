const express = require("express");
const customerActivityLogController = require("@controllers/customerActivityLog.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", customerActivityLogController.getCustomerActivityLogs);

module.exports = router;