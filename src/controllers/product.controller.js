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

const rateProduct = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { rating } = req.body;

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ status: "fail", message: "Invalid rating value (1-5)" });
  }

  const data = await productService.rateProduct(slug, rating);
  if (!data) return res.notFound();

  return res.success(data, "Product rated successfully");
});

const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { collectionId, discountCampainId } = req.body;
  
  const data = await productService.updateProduct(id, { collectionId, discountCampainId });
  if (!data) return res.notFound();
  
  return res.success(data, "Product updated successfully");
});

module.exports = { getProducts, getProductBySlug, rateProduct, updateProduct };
