const { prisma } = require("@libs/prisma");
const notificationService = require("@services/notification.service");
const slugify = require("@utils/slugify")

// Create article
async function createArticle(authorId, { slug, coverImage, translations }) {
  const articleSlug = slug || slugify(translations?.[0]?.title || "article") + "-" + Date.now().toString(36);

  const article = await prisma.article.create({
    data: {
      slug: articleSlug,
      authorId,
      coverImage,
      translations: { create: translations },
    },
    include: { translations: true },
  });

  // Send notification to all admins about new article
  const title = translations?.[0]?.title || "New Article";
  const admins = await prisma.adminUser.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  for (const admin of admins) {
    await notificationService.createNotification(admin.id, "ADMIN", {
      type: "ARTICLE_CREATED",
      title: "New Article Created",
      message: `New article: "${title}"`,
      metadata: { articleId: article.id, authorId },
    });
  }

  return article;
}

// Get all articles
async function getArticles() {
  return prisma.article.findMany({
    where: { deletedAt: null },
    include: {
      translations: true,
      author: { select: { id: true, fullName: true } },
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
      author: { select: { id: true, fullName: true } },
    },
  });
  if (!article) return res.notFound();
  return article;
}

// Update article by slug
async function updateArticle(slug, authorId, data) {
  const article = await prisma.article.findFirst({ where: { slug, authorId, deletedAt: null } });
  if (!article) return res.notFound();

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
  if (!article) return res.notFound();

  return prisma.article.update({
    where: { id: article.id },
    data: { deletedAt: new Date() },
  });
}

// Approve article (publish it)
async function approveArticle(articleId, adminId) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { select: { id: true, fullName: true } } },
  });

  if (!article) return res.notFound();

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { publishedAt: new Date() },
    include: { translations: true, author: { select: { id: true, fullName: true } } },
  });

  // Send notification to author
  const title = updated.translations?.[0]?.title || "Your Article";
  await notificationService.createNotification(article.author.id, "CUSTOMER", {
    type: "ARTICLE_APPROVED",
    title: "Article Approved",
    message: `Your article "${title}" has been approved and published`,
    metadata: { articleId },
  });

  return updated;
}

/**
 * Get articles by locale (only published articles).
 */
async function getArticlesByLocale(locale) {
  return prisma.article.findMany({
    where: { deletedAt: null, publishedAt: true, translations: { some: { locale } } },
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
    where: { slug, deletedAt: null, publishedAt: true, translations: { some: { locale } } },
    include: {
      translations: { where: { locale } },
      author: { select: { id: true, fullName: true, slug: true } },
    },
  });
  if (!article) return res.notFound();
  return article;
}

module.exports = { createArticle, getArticles, getArticleBySlug, updateArticle, deleteArticle, getArticlesByLocale, getArticleBySlugAndLocale, approveArticle };
