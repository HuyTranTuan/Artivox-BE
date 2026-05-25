const crypto = require("node:crypto");
const path = require("node:path");
const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { HTTP_CODES } = require("@/config/constants");
const r2Client = require("@libs/r2");
const AppError = require("@utils/AppError");

const STAFF_IMAGE_VARIANTS = [
  { name: "sm", width: 480 },
  { name: "md", width: 960 },
  { name: "lg", width: 1440 },
];

function getBucketName() {
  if (!process.env.R2_BUCKET_NAME) {
    throw new AppError("Missing R2_BUCKET_NAME", HTTP_CODES.INTERNAL_SERVER_ERROR);
  }

  return process.env.R2_BUCKET_NAME;
}

function buildPublicUrl(key) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/+$/, "")}/${key}`;
}

function normalizeFileName(fileName = "image") {
  return path
    .parse(fileName)
    .name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
}

async function uploadStaffImage(file, staffId) {
  if (!file?.buffer?.length) {
    throw new AppError("Image file required", HTTP_CODES.BAD_REQUESTED);
  }

  if (!file.mimetype?.startsWith("image/")) {
    throw new AppError("Only image upload supported", HTTP_CODES.BAD_REQUESTED);
  }

  const bucket = getBucketName();
  const image = sharp(file.buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const stamp = Date.now();
  const safeName = normalizeFileName(file.originalname);
  const assetId = crypto.randomUUID();
  const keyPrefix = `staff/${staffId}/${stamp}-${safeName}-${assetId}`;

  const variants = await Promise.all(
    STAFF_IMAGE_VARIANTS.map(async ({ name, width }) => {
      const body = await sharp(file.buffer, { failOn: "none" })
        .rotate()
        .resize({
          width,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();

      const key = `${keyPrefix}-${name}.webp`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      return {
        name,
        width,
        key,
        size: body.length,
        url: buildPublicUrl(key),
      };
    }),
  );

  return {
    bucket,
    originalName: file.originalname,
    contentType: "image/webp",
    original: {
      width: metadata.width || null,
      height: metadata.height || null,
      size: file.size || file.buffer.length,
    },
    variants,
  };
}

module.exports = {
  STAFF_IMAGE_VARIANTS,
  uploadStaffImage,
};
