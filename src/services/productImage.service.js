const path = require("node:path");
const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { prisma } = require("@libs/prisma");
const r2Client = require("@libs/r2");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@utils/AppError");

function getBucketName() {
  if (!process.env.R2_BUCKET_NAME) {
    throw new AppError("Missing R2_BUCKET_NAME", HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
  return process.env.R2_BUCKET_NAME;
}

function buildPublicUrl(key) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

/**
 * Upload a single image buffer to R2 and return the public URL.
 * @param {Buffer} buffer
 * @param {string} key - R2 object key
 * @returns {Promise<string>} public URL
 */
async function uploadToR2(buffer, key) {
  const bucket = getBucketName();
  const webpBuffer = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: webpBuffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return buildPublicUrl(key);
}

/**
 * Upload product images to R2 and create ProductImage records.
 * Path convention: products/{slug}/thumbnail-before.webp, thumbnail-after.webp, gallery-{i}.webp
 *
 * @param {BigInt} productId
 * @param {string} slug - product slug for R2 key prefix
 * @param {object} files - multer files object { thumbnail_before, thumbnail_after, gallery }
 * @returns {Promise<string[]>} array of created image URLs
 */
async function uploadProductImages(productId, slug, files) {
  const urls = [];
  const imageRecords = [];

  // Thumbnail Before
  if (files?.thumbnail_before?.[0]) {
    const file = files.thumbnail_before[0];
    const key = `products/${slug}/thumbnail-before.webp`;
    const url = await uploadToR2(file.buffer, key);
    urls.push(url);

    await prisma.productImage.deleteMany({
      where: { productId, role: "THUMBNAIL_BEFORE" },
    });

    imageRecords.push({
      productId,
      url,
      altText: `${slug} thumbnail before`,
      role: "THUMBNAIL_BEFORE",
      sortOrder: 0,
    });
  }

  // Thumbnail After
  if (files?.thumbnail_after?.[0]) {
    const file = files.thumbnail_after[0];
    const key = `products/${slug}/thumbnail-after.webp`;
    const url = await uploadToR2(file.buffer, key);
    urls.push(url);

    await prisma.productImage.deleteMany({
      where: { productId, role: "THUMBNAIL_AFTER" },
    });

    imageRecords.push({
      productId,
      url,
      altText: `${slug} thumbnail after`,
      role: "THUMBNAIL_AFTER",
      sortOrder: 1,
    });
  }

  // Gallery
  if (files?.gallery?.length) {
    // Determine starting index to avoid overwriting existing R2 files if we are appending
    const existingGalleryCount = await prisma.productImage.count({
      where: { productId, role: "GALLERY" },
    });

    for (let i = 0; i < files.gallery.length; i++) {
      const file = files.gallery[i];
      const key = `products/${slug}/gallery-${existingGalleryCount + i}.webp`;
      const url = await uploadToR2(file.buffer, key);
      urls.push(url);
      imageRecords.push({
        productId,
        url,
        altText: `${slug} gallery ${existingGalleryCount + i}`,
        role: "GALLERY",
        sortOrder: existingGalleryCount + i + 2,
      });
    }
  }

  // Bulk create ProductImage records
  if (imageRecords.length) {
    await prisma.productImage.createMany({ data: imageRecords });
  }

  return urls;
}

/**
 * Upload a single collection image to R2.
 * Path: collections/{slug}/image.webp
 */
async function uploadCollectionImage(slug, file) {
  if (!file?.buffer) return null;
  const key = `collections/${slug}/image.webp`;
  return uploadToR2(file.buffer, key);
}

/**
 * Build a signed/secure URL for an image. For now using R2 public URL.
 * Wraps the raw URL for future signing support.
 */
function getSecureImageUrl(url) {
  if (!url) return null;
  // If already a full URL, return as-is (R2 public URL)
  // In production, this could add signed tokens
  return url;
}

/**
 * Map product images through getSecureImageUrl
 */
function secureProductImages(product) {
  if (!product) return product;
  const secured = { ...product };
  if (secured.images) {
    secured.images = secured.images.map((img) => ({
      ...img,
      url: getSecureImageUrl(img.url),
    }));
  }
  return secured;
}

module.exports = {
  uploadToR2,
  uploadProductImages,
  uploadCollectionImage,
  getSecureImageUrl,
  secureProductImages,
};
