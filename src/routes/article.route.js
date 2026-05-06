const express = require("express");
const articleController = require("@controllers/article.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");

const router = express.Router();

// Public - locale specific (must come before generic :slug)
router.get("/articles/vi", (req, res, next) => { req.params.locale = "vi"; next(); }, articleController.getArticlesByLocale);
router.get("/articles/en", (req, res, next) => { req.params.locale = "en"; next(); }, articleController.getArticlesByLocale);
router.get("/articles/vi/:slug", (req, res, next) => { req.params.locale = "vi"; next(); }, articleController.getArticleBySlugAndLocale);
router.get("/articles/en/:slug", (req, res, next) => { req.params.locale = "en"; next(); }, articleController.getArticleBySlugAndLocale);

// Public - general
router.get("/articles", articleController.getArticles);
router.get("/articles/:slug", articleController.getArticleBySlug);

// Admin CRUD
router.post("/articles", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.createArticle);
router.put("/articles/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.updateArticle);
router.delete("/articles/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.deleteArticle);

module.exports = router;