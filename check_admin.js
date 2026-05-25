require("module-alias/register"); // ensure aliases work if needed
const { prisma } = require("./src/libs/prisma");

async function main() {
  const users = await prisma.adminUser.findMany();
  console.log(users);
}

main().finally(() => process.exit(0));
