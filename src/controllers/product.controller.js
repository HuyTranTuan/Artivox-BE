const productService = require("@services/product.service");
const catchAsync = require("@utils/catchAsync");

const getProducts = catchAsync(async (req, res) => {
  const query = { ...req.query };
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  const data = await productService.getProducts(query);
  return res.success(data, "Products fetched");
});

const getProductBySlug = catchAsync(async (req, res) => {
  const query = {};
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    query.isActive = true;
  }
  const data = await productService.getProductBySlug(req.params.slug, query);
  if (!data) return res.notFound();
  return res.success(data, "Product detail fetched");
});

module.exports = { getProducts, getProductBySlug };
