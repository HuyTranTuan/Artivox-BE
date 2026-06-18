const customerService = require("@services/customer.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all customers
const getCustomers = catchAsync(async (req, res) => {
  const data = await customerService.getCustomers();
  return res.success(data, "Customers fetched");
});

// Fetch a single customer by slug
const getCustomerBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const data = await customerService.getCustomerBySlug(slug);
  if (!data) res.notFound();
  return res.success(data, "Customer detail fetched");
});

// Fetch a single customer by email
const getCustomerByEmail = catchAsync(async (req, res) => {
  const { email } = req.params;
  const data = await customerService.getCustomerByEmail(email);
  if (!data) res.notFound();
  return res.success(data, "Customer detail fetched");
});

// Update customer (admin)
const updateCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await customerService.updateCustomer(id, req.body);
  return res.success(data, "Customer updated");
});

// Soft-delete customer (admin)
const deleteCustomer = catchAsync(async (req, res) => {
  const { id } = req.params;
  await customerService.deleteCustomer(id);
  return res.success(null, "Customer deleted");
});

module.exports = { getCustomers, getCustomerBySlug, getCustomerByEmail, updateCustomer, deleteCustomer };
