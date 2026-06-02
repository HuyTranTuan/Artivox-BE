const express = require("express");
const articleController = require("@controllers/article.controller");
const { authMiddleware, restrictTo } = require("@middlewares/auth.middleware");
const { uploadProductImages } = require("@middlewares/upload.middleware");

const router = express.Router();

// Public - locale specific (must come before generic :slug)
router.get(
  "/:language(en|vi|vn)",
  (req, res, next) => {
    req.params.locale = req.params.language === "vn" ? "vi" : req.params.language;
    next();
  },
  articleController.getArticlesByLocale,
);

router.get(
  "/:language(en|vi|vn)/:slug",
  (req, res, next) => {
    req.params.locale = req.params.language === "vn" ? "vi" : req.params.language;
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
