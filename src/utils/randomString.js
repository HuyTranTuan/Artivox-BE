const crypto = require("node:crypto");

function randomString(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

module.exports = randomString;
