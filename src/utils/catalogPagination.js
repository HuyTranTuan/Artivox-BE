const DEFAULT_CATALOG_LIMIT = 10;
const MAX_CATALOG_LIMIT = 10;

function normalizeCatalogPagination(query = {}) {
  const rawSearch = typeof query.search === "string" ? query.search.trim() : "";
  const parsedLimit = Number.parseInt(query.limit, 10);
  const parsedSkip = Number.parseInt(query.skip, 10);

  return {
    search: rawSearch || undefined,
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_CATALOG_LIMIT) : DEFAULT_CATALOG_LIMIT,
    skip: Number.isInteger(parsedSkip) && parsedSkip >= 0 ? parsedSkip : 0,
  };
}

module.exports = {
  DEFAULT_CATALOG_LIMIT,
  MAX_CATALOG_LIMIT,
  normalizeCatalogPagination,
};
