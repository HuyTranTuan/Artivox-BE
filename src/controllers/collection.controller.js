const collectionService = require("@services/collection.service");
const { normalizeCatalogPagination } = require("@utils/catalogPagination");
const catchAsync = require("@utils/catchAsync");

const getCollections = catchAsync(async (req, res) => {
  const query = normalizeCatalogPagination(req.query);
  const data = await collectionService.getCollections(query);

  return res.paginatedSuccess(
    data.items,
    {
      total: data.total,
      limit: data.limit,
      skip: data.skip,
    },
    "Collections fetched",
  );
});

const getCollectionBySlug = catchAsync(async (req, res) => {
  const data = await collectionService.getCollectionBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Collection detail fetched");
});

module.exports = { getCollections, getCollectionBySlug };
