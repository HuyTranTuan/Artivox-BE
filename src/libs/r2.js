const { S3Client } = require("@aws-sdk/client-s3");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@utils/AppError");

if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new AppError("Missing R2 credentials", HTTP_CODES.INTERNAL_SERVER_ERROR);
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = r2Client;
