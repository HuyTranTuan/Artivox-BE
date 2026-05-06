const customerActivityLogService = require("@services/customerActivityLog.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all customer activity logs (auth required)
const getCustomerActivityLogs = catchAsync(async (req, res) => {
  const data = await customerActivityLogService.getCustomerActivityLogs();
  return res.success(data, "Customer activity logs fetched");
});

module.exports = { getCustomerActivityLogs };