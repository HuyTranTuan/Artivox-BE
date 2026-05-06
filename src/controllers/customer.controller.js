const customerService = require("@services/customer.service");
const catchAsync = require("@utils/catchAsync");
const AppError = require("@utils/AppError");

// Fetch all customers
const getCustomers = catchAsync(async (req, res) => {
  const data = await customerService.getCustomers();
  return res.success(data, "Customers fetched");
});

// Fetch a single customer by slug
const getCustomerBySlug = catchAsync(async (req, res) => {
  const data = await customerService.getCustomerBySlug(req.params.slug);
  if (!data) throw new AppError("Customer not found", 404);
  return res.success(data, "Customer detail fetched");
});

module.exports = { getCustomers, getCustomerBySlug };