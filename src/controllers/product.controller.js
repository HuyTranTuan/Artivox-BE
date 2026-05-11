const productService = require("@services/product.service");
const catchAsync = require("@utils/catchAsync");

const getProducts = catchAsync(async (req, res) => {
  const data = await productService.getProducts(req.query);
  return res.success(data, "Products fetched");
});

const getProductBySlug = catchAsync(async (req, res) => {
  const data = await productService.getProductBySlug(req.params.slug);
  if (!data) return res.notFound();
  return res.success(data, "Product detail fetched");
});

module.exports = { getProducts, getProductBySlug };
