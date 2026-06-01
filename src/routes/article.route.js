const express = require("express");
const articleController = require("@controllers/article.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

// Public - locale specific (must come before generic :slug)
router.get(
  "/vi",
  (req, res, next) => {
    req.params.locale = "vi";
    next();
  },
  articleController.getArticlesByLocale,
);
router.get(
  "/en",
  (req, res, next) => {
    req.params.locale = "en";
    next();
  },
  articleController.getArticlesByLocale,
);
router.get(
  "/vi/:slug",
  (req, res, next) => {
    req.params.locale = "vi";
    next();
  },
  articleController.getArticleBySlugAndLocale,
);
router.get(
  "/en/:slug",
  (req, res, next) => {
    req.params.locale = "en";
    next();
  },
  articleController.getArticleBySlugAndLocale,
);

// Public - general
router.get("/", articleController.getArticles);
router.get("/:slug", articleController.getArticleBySlug);

// Admin CRUD
router.post("/", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), uploadProductImages, articleController.createArticle);
router.put("/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), uploadProductImages, articleController.updateArticle);
router.delete("/:slug", authMiddleware, restrictTo("ADMIN", "MANAGER", "STAFF"), articleController.deleteArticle);
router.patch("/:articleId/approve", authMiddleware, restrictTo("ADMIN", "MANAGER"), articleController.approveArticle);

module.exports = router;
