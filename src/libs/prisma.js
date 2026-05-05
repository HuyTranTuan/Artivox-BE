const path = require("path");

// PostgreSQL Prisma Client
let prisma;
try {
  const { PrismaClient } = require(path.join(__dirname, "../../generated"));
  prisma = new PrismaClient();
} catch (error) {
  console.warn(
    "⚠️  Prisma client not available. Run: npm run prisma:generate"
  );
}

module.exports = { prisma };
