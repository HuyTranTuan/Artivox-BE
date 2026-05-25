require("module-alias/register");
const { prisma } = require("./src/libs/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 12);
  await prisma.adminUser.update({
    where: { email: "admin1@gmail.com" },
    data: { password: hashedPassword },
  });
  console.log("Password updated to 123456");
}

main().finally(() => process.exit(0));
