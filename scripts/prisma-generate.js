/**
 * Prisma Generate Script
 * Runs prisma generate in isolated process to avoid enum conflicts
 * when using multiple schema files.
 */
const { execSync } = require("child_process");
const path = require("path");

const schemas = [
  { name: "PostgreSQL", path: path.join(__dirname, "../prisma/schema.prisma") },
];

console.log("🔄 Generating Prisma clients...\n");

for (const schema of schemas) {
  try {
    console.log(`  📦 Generating ${schema.name} client...`);
    execSync(`npx prisma generate --schema="${schema.path}"`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log(`  ✅ ${schema.name} client generated\n`);
  } catch (error) {
    console.error(`  ❌ Failed to generate ${schema.name} client:`, error.message);
    process.exit(1);
  }
}

console.log("✅ All Prisma clients generated successfully!");
