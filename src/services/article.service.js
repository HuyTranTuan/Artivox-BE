const { prisma } = require("@libs/prisma");
const notificationService = require("@services/notification.service");
const productImageService = require("@services/productImage.service");
const slugify = require("@utils/slugify");
const { HTTP_CODES } = require("@config/constants");
const AppError = require("@utils/AppError");

// Create article
async function createArticle(authorId, data, files) {
  let { slug, coverImage, translations } = data;
  if (typeof translations === "string") {
    try { translations = JSON.parse(translations); } catch (e) {}
  }

  const articleSlug = slug || slugify(translations?.[0]?.title || "article") + "-" + Date.now().toString(36);

  let article = await prisma.article.create({
    data: {
      slug: articleSlug,
      authorId,
      coverImage,
      translations: { create: translations },
    },
    include: { translations: true },
  });

  if (files && files.coverImage && files.coverImage[0]) {
    const uploadedUrl = await productImageService.uploadArticleImage(article.id, files.coverImage[0]);
    article = await prisma.article.update({
      where: { id: article.id },
      data: { coverImage: uploadedUrl },
      include: { translations: true },
    });
  }

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
  if (!article) throw new AppError("Article not found", HTTP_CODES.NOT_FOUND);
  return article;
}

// Update article by slug
async function updateArticle(slug, user, data, files) {
  const article = await prisma.article.findFirst({ where: { slug, deletedAt: null } });
  if (!article) throw new AppError("Article not found", HTTP_CODES.NOT_FOUND);

  let { translations, status, ...articleData } = data;
  if (typeof translations === "string") {
    try { translations = JSON.parse(translations); } catch (e) {}
  }

  if (files && files.coverImage && files.coverImage[0]) {
    articleData.coverImage = await productImageService.uploadArticleImage(article.id, files.coverImage[0]);
  }

  // Only ADMIN/MANAGER can update publishedAt or status
  if (user && (user.role === "ADMIN" || user.role === "MANAGER")) {
    if (status === "Published") {
      articleData.publishedAt = article.publishedAt || new Date();
    } else if (status === "Draft" || status === "Review") {
      articleData.publishedAt = null;
    }
  }

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
  const article = await prisma.article.findFirst({ where: { slug, deletedAt: null } });
  if (!article) throw new AppError("Article not found", HTTP_CODES.NOT_FOUND);

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

  if (!article) throw new AppError("Article not found", HTTP_CODES.NOT_FOUND);

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
    where: { deletedAt: null, publishedAt: { not: null }, translations: { some: { locale } } },
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
    where: { slug, deletedAt: null, publishedAt: { not: null }, translations: { some: { locale } } },
    include: {
      translations: { where: { locale } },
      author: { select: { id: true, fullName: true, slug: true } },
    },
  });
  if (!article) throw new AppError("Article not found", HTTP_CODES.NOT_FOUND);

  // Increment view count asynchronously
  prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  }).catch(console.error);

  return article;
}

module.exports = { createArticle, getArticles, getArticleBySlug, updateArticle, deleteArticle, getArticlesByLocale, getArticleBySlugAndLocale, approveArticle };
