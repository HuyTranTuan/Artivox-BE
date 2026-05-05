const express = require("express");
const articleController = require("@controllers/article.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public
router.get("/articles", articleController.getArticles);
router.get("/articles/:slug", articleController.getArticleBySlug);

// Admin CRUD
router.post("/articles", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.createArticle);
router.put("/articles/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.updateArticle);
router.delete("/articles/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.deleteArticle);

module.exports = router;
