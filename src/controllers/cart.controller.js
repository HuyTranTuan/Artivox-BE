const cartService = require("@services/cart.service");
const catchAsync = require("@utils/catchAsync");

const getCart = catchAsync(async (req, res) => {
  const data = await cartService.getCart(req.user.id);
  return res.success(data, "Cart fetched");
});

const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const data = await cartService.addToCart(req.user.id, productId, quantity);
  return res.success(data, "Added to cart", 201);
});

const updateCartItem = catchAsync(async (req, res) => {
  const { quantity } = req.body;
  const data = await cartService.updateCartItem(req.params.id, req.user.id, quantity);
  return res.success(data, "Cart updated");
});

const removeFromCart = catchAsync(async (req, res) => {
  const data = await cartService.removeFromCart(req.params.id, req.user.id);
  return res.success(data, "Removed from cart");
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
