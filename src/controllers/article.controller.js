const articleService = require("@services/article.service");
const catchAsync = require("@utils/catchAsync");

const getArticles = catchAsync(async (req, res) => {
  const data = await articleService.getArticles();
  return res.success(data, "Articles fetched");
});

const getArticleBySlug = catchAsync(async (req, res) => {
  const data = await articleService.getArticleBySlug(req.params.slug);
  return res.success(data, "Article fetched");
});

const createArticle = catchAsync(async (req, res) => {
  const data = await articleService.createArticle(req.user.id, req.body);
  return res.success(data, "Article created", 201);
});

const updateArticle = catchAsync(async (req, res) => {
  const data = await articleService.updateArticle(req.params.slug, req.user.id, req.body);
  return res.success(data, "Article updated");
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticle(req.params.slug, req.user.id);
  return res.success(null, "Article deleted");
});

module.exports = { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle };
