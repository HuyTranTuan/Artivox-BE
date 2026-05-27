const collectionService = require("@services/collection.service");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");
const catchAsync = require("@utils/catchAsync");

const getCollections = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await collectionService.getCollections(query);
  return res.paginatedSuccess(data.items, { total: data.total, limit: data.limit, skip: data.skip }, "Collections fetched");
});

const getCollectionsAdmin = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await collectionService.getCollectionsAdmin(query);
  return res.paginatedSuccess(data.items, { total: data.total, limit: data.limit, skip: data.skip }, "Collections fetched");
});

const getCollectionBySlug = catchAsync(async (req, res) => {
  const data = await collectionService.getCollectionBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Collection detail fetched");
});

const createCollection = catchAsync(async (req, res) => {
  const data = await collectionService.createCollection(req.body, req.files);
  return res.success(data, "Collection created");
});

const updateCollection = catchAsync(async (req, res) => {
  const data = await collectionService.updateCollectionBySlug(req.params.slug, req.body, req.files);
  if (!data) return res.notFound();
  return res.success(data, "Collection updated");
});

const addProductToCollection = catchAsync(async (req, res) => {
  const data = await collectionService.addProductToCollection(req.params.id, req.body.productSlug);
  if (!data) return res.notFound("Product not found");
  return res.success(data, "Product added to collection");
});

const removeProductFromCollection = catchAsync(async (req, res) => {
  const data = await collectionService.removeProductFromCollection(req.params.productId);
  return res.success(data, "Product removed from collection");
});

const deleteCollection = catchAsync(async (req, res) => {
  const data = await collectionService.deleteCollectionBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Collection deleted");
});

module.exports = {
  getCollections,
  getCollectionsAdmin,
  getCollectionBySlug,
  createCollection,
  updateCollection,
  addProductToCollection,
  removeProductFromCollection,
  deleteCollection,
};

