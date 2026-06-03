const articleService = require("@services/article.service");
const catchAsync = require("@utils/catchAsync");
const { clearCache } = require("@middlewares/cache.middleware");

const getArticles = catchAsync(async (req, res) => {
  const data = await articleService.getArticles();
  return res.success(data, "Articles fetched");
});

const getArticleBySlug = catchAsync(async (req, res) => {
  const data = await articleService.getArticleBySlug(req.params.slug);
  return res.success(data, "Article fetched");
});

const createArticle = catchAsync(async (req, res) => {
  const data = await articleService.createArticle(req.user.id, req.body, req.files);
  await clearCache("articles:*");
  await clearCache("articles_locale:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  return res.success(data, "Article created", 201);
});

const updateArticle = catchAsync(async (req, res) => {
  const data = await articleService.updateArticle(req.params.slug, req.user, req.body, req.files);
  await clearCache("articles:*");
  await clearCache("article:*");
  await clearCache("articles_locale:*");
  await clearCache("article_locale:*");
  return res.success(data, "Article updated");
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticle(req.params.slug, req.user.id);
  await clearCache("articles:*");
  await clearCache("article:*");
  await clearCache("articles_locale:*");
  await clearCache("article_locale:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  return res.success(null, "Article deleted");
});

// Get articles by locale (vi or en)
const getArticlesByLocale = catchAsync(async (req, res) => {
  const data = await articleService.getArticlesByLocale(req.params.locale);
  return res.success(data, "Articles fetched");
});

// Get article by slug and locale (vi or en)
const getArticleBySlugAndLocale = catchAsync(async (req, res) => {
  const data = await articleService.getArticleBySlugAndLocale(req.params.slug, req.params.locale);
  return res.success(data, "Article fetched");
});

// Approve article (admin only)
const approveArticle = catchAsync(async (req, res) => {
  const { articleId } = req.params;
  const data = await articleService.approveArticle(BigInt(articleId), req.user.id);
  if (!data) return res.notFound();
  
  await clearCache("articles:*");
  await clearCache("article:*");
  await clearCache("articles_locale:*");
  await clearCache("article_locale:*");
  await clearCache("admin_dashboard:*");
  await clearCache("staff_dashboard:*");
  
  return res.success(data, "Article approved");
});

module.exports = { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, getArticlesByLocale, getArticleBySlugAndLocale, approveArticle };
