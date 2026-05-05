const { prisma } = require("@libs/prisma");

// Fetch all tool products.
async function getTools() {
  return prisma.product.findMany({
    where: { deletedAt: null, type: "TOOL" },
    include: { tool: true },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = {
  getTools,
};
