const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2Client = require("@libs/r2");

const BUCKET = () => {
  if (!process.env.R2_BUCKET_NAME) throw new Error("Missing R2_BUCKET_NAME");
  return process.env.R2_BUCKET_NAME;
};

/**
 * Derive the R2 object key from a public R2 URL.
 * e.g. "https://pub-xxx.r2.dev/models/foo.glb" → "models/foo.glb"
 */
function keyFromUrl(publicUrl) {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (base && publicUrl.startsWith(base + "/")) {
    return publicUrl.slice(base.length + 1);
  }
  // Fallback: strip protocol + host
  return new URL(publicUrl).pathname.replace(/^\//, "");
}

/**
 * Generate a presigned GetObject URL (default 60 s).
 */
async function getPresignedUrl(key, expiresIn = 60) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET(), Key: key });
  return getSignedUrl(r2Client, cmd, { expiresIn });
}

/**
 * Stream R2 object bytes via a presigned URL.
 * Returns { stream, contentType, contentLength }.
 */
async function streamModel(sourceFileUrl) {
  const key = keyFromUrl(sourceFileUrl);
  const signed = await getPresignedUrl(key, 60);

  const res = await fetch(signed);
  if (!res.ok) throw new Error(`R2 fetch failed: ${res.status}`);

  return {
    stream: res.body, // ReadableStream
    contentType: res.headers.get("content-type") || "application/octet-stream",
    contentLength: res.headers.get("content-length") || null,
  };
}

module.exports = { streamModel, getPresignedUrl, keyFromUrl };
