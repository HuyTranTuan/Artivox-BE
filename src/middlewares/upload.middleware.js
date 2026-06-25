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
const MODEL_3D_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

const uploadStaffImageMiddleware = multer({
  storage: memoryStorage,
  limits: { fileSize: fileSizeLimit },
  fileFilter: imageFilter,
}).single("file");

// Product images: thumbnail_before, thumbnail_after, gallery[], srcset images, 3D source file
const uploadProductImages = multer({
  storage: memoryStorage,
  limits: { fileSize: MODEL_3D_SIZE_LIMIT },
}).fields([
  { name: "thumbnail_before", maxCount: 1 },
  { name: "thumbnail_after", maxCount: 1 },
  { name: "gallery", maxCount: 20 },
  { name: "image", maxCount: 1 },       // collection image
  { name: "coverImage", maxCount: 1 },  // article image
  { name: "source_file", maxCount: 1 }, // 3D model file
  { name: "img_mobile", maxCount: 1 },
  { name: "img_tablet", maxCount: 1 },
  { name: "img_pc", maxCount: 1 },
]);

module.exports = {
  uploadStaffImageMiddleware,
  uploadProductImages,
};
