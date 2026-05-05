const productService = require("@services/product.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

const getProducts = catchAsync(async (req, res) => {
  const data = await productService.getProducts(req.query);
  return res.success(data, "Products fetched");
});

const getProductBySlug = catchAsync(async (req, res) => {
  const data = await productService.getProductBySlug(req.params.slug);
  if (!data) throw new AppError("Product not found", 404);
  return res.success(data, "Product detail fetched");
});

module.exports = { getProducts, getProductBySlug };
