const collectionService = require("@services/collection.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

const getCollections = catchAsync(async (req, res) => {
  const data = await collectionService.getCollections();
  return res.success(data, "Collections fetched");
});

const getCollectionBySlug = catchAsync(async (req, res) => {
  const data = await collectionService.getCollectionBySlug(req.params.slug);
  if (!data) throw new AppError("Collection not found", 404);
  return res.success(data, "Collection detail fetched");
});

module.exports = { getCollections, getCollectionBySlug };
