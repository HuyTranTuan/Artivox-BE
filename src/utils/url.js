const appConfig = require("@/config/app");

const fullUrl = (path) => {
  return `${appConfig.baseUrl}/${path.replace(/\\/g, "/")}`;
};

module.exports = { fullUrl };
