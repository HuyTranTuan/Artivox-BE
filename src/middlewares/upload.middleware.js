const multer = require("multer");
const { HTTP_CODES } = require("@/config/constants");
const AppError = require("@utils/AppError");

const imageFilter = (req, file, callback) => {
  if (!file.mimetype?.startsWith("image/")) {
    callback(new AppError("Only image upload supported", HTTP_CODES.BAD_REQUESTED));
    return;
  }
  callback(null, true);
};

const memoryStorage = multer.memoryStorage();
const fileSizeLimit = Number(process.env.STAFF_IMAGE_MAX_FILE_SIZE || 10 * 1024 * 1024);

const uploadStaffImageMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: fileSizeLimit },
  fileFilter: imageFilter,
}).single("file");

// Product images: thumbnail_before, thumbnail_after, gallery[]
const uploadProductImages = multer({
  storage: memoryStorage,
  limits: { fileSize: fileSizeLimit },
  fileFilter: imageFilter,
}).fields([
  { name: "thumbnail_before", maxCount: 1 },
  { name: "thumbnail_after", maxCount: 1 },
  { name: "gallery", maxCount: 20 },
  { name: "image", maxCount: 1 }, // collection image
]);

module.exports = {
  uploadStaffImageMiddleware,
  uploadProductImages,
};
