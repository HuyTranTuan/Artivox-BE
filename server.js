// Load module aliases first
require("module-alias/register");
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = require("@/index");

const PORT = process.env.API_PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health\n`);
});
