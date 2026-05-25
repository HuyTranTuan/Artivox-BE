const multer = require("multer");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@utils/AppError");

const uploadStaffImageMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.STAFF_IMAGE_MAX_FILE_SIZE || 10 * 1024 * 1024),
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype?.startsWith("image/")) {
      callback(new AppError("Only image upload supported", HTTP_CODES.BAD_REQUESTED));
      return;
    }

    callback(null, true);
  },
}).single("file");

module.exports = {
  uploadStaffImageMiddleware,
};
