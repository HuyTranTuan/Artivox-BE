const DEFAULT_CATALOG_LIMIT = 20;
const MAX_CATALOG_LIMIT = 50;

function normalizeCatalogPagination(query = {}) {
  const rawSearch = typeof query.search === "string" ? query.search.trim() : "";
  const parsedLimit = Number.parseInt(query.limit, 10);
  const parsedSkip = Number.parseInt(query.skip, 10);

  const normalized = {
    search: rawSearch || undefined,
    limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, MAX_CATALOG_LIMIT) : DEFAULT_CATALOG_LIMIT,
    skip: Number.isInteger(parsedSkip) && parsedSkip >= 0 ? parsedSkip : 0,
  };

  if (query.isActive !== undefined) {
    if (query.isActive === "true" || query.isActive === true) {
      normalized.isActive = true;
    } else if (query.isActive === "false" || query.isActive === false) {
      normalized.isActive = false;
    }
  }

  return normalized;
}

module.exports = {
  DEFAULT_CATALOG_LIMIT,
  MAX_CATALOG_LIMIT,
  normalizeCatalogPagination,
};
