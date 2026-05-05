const toolService = require("@services/tool.service");
const catchAsync = require("@utils/catchAsync");

// Fetch all tool products
const getTools = catchAsync(async (req, res) => {
  const data = await toolService.getTools();
  return res.success(data, "Tools fetched");
});

module.exports = { getTools };
