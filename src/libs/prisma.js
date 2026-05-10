// PostgreSQL Prisma Client
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@root/generated");

const dbConfiguration = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  checkDuplicate: true,
  idleTimeout: 600,
};
const adapter = new PrismaPg(dbConfiguration);
const prisma = new PrismaClient({
  adapter,
  errorFormat: "pretty",
  transactionOptions: {
    isolationLevel: "Serializable",
    timeout: 1000,
    maxWait: 1000,
    readOnly: false,
    deferrable: false,
  },
});

module.exports = { prisma };
