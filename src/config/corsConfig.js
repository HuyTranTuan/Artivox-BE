const urlList = JSON.parse(process.env.FE_URL || '[]');
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

const corsConfig = {
  origin: urlList,
  methods: methods,
  credentials: true,
};

const socketCorsConfig = {
  origin: urlList,
  methods: methods,
  credentials: true,
};

module.exports = { corsConfig, socketCorsConfig };
