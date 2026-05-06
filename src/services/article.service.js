const { prisma } = require("@libs/prisma");
const AppError = require("@utils/AppError");

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Create article
async function createArticle(authorId, { slug, coverImage, translations }) {
  const articleSlug = slug || slugify(translations?.[0]?.title || "article") + "-" + Date.now().toString(36);

  return prisma.article.create({
    data: {
      slug: articleSlug,
      authorId,
      coverImage,
      translations: { create: translations },
    },
    include: { translations: true },
  });
}

// Get all articles
async function getArticles() {
  return prisma.article.findMany({
    where: { deletedAt: null },
    include: {
      translations: true,
      author: { select: { id: true, fullName: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Get article by slug
async function getArticleBySlug(slug) {
  const article = await prisma.article.findFirst({
    where: { slug, deletedAt: null },
    include: {
      translations: true,
      author: { select: { id: true, fullName: true, slug: true } },
    },
  });
  if (!article) throw new AppError("Article not found", 404);
  return article;
}

// Update article by slug
async function updateArticle(slug, authorId, data) {
  const article = await prisma.article.findFirst({ where: { slug, authorId, deletedAt: null } });
  if (!article) throw new AppError("Article not found", 404);

  const { translations, ...articleData } = data;

  return prisma.article.update({
    where: { id: article.id },
    data: {
      ...articleData,
      ...(translations && {
        translations: {
          upsert: translations.map((t) => ({
            where: { articleId_locale: { articleId: article.id, locale: t.locale } },
            update: { title: t.title, content: t.content, summary: t.summary },
            create: { locale: t.locale, title: t.title, content: t.content, summary: t.summary },
          })),
        },
      }),
    },
    include: { translations: true },
  });
}

// Delete article by slug (soft)
async function deleteArticle(slug, authorId) {
  const article = await prisma.article.findFirst({ where: { slug, authorId, deletedAt: null } });
  if (!article) throw new AppError("Article not found", 404);

  return prisma.article.update({
    where: { id: article.id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Get articles by locale (only published articles).
 */
async function getArticlesByLocale(locale) {
  return prisma.article.findMany({
    where: { deletedAt: null, isPublished: true, translations: { some: { locale } } },
    include: {
      translations: { where: { locale } },
      author: { select: { id: true, fullName: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get article by slug and locale (must be published).
 */
async function getArticleBySlugAndLocale(slug, locale) {
  const article = await prisma.article.findFirst({
    where: { slug, deletedAt: null, isPublished: true, translations: { some: { locale } } },
    include: {
      translations: { where: { locale } },
      author: { select: { id: true, fullName: true, slug: true } },
    },
  });
  if (!article) throw new AppError("Article not found", 404);
  return article;
}

module.exports = { createArticle, getArticles, getArticleBySlug, updateArticle, deleteArticle, getArticlesByLocale, getArticleBySlugAndLocale };
