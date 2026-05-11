const collectionService = require("@services/collection.service");
const catchAsync = require("@utils/catchAsync");

const getCollections = catchAsync(async (req, res) => {
  const data = await collectionService.getCollections();
  return res.success(data, "Collections fetched");
});

const getCollectionBySlug = catchAsync(async (req, res) => {
  const data = await collectionService.getCollectionBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Collection detail fetched");
});

module.exports = { getCollections, getCollectionBySlug };
