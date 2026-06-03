let urlList = [];
try {
  const parsed = JSON.parse(process.env.FE_URL || '[]');
  if (Array.isArray(parsed)) {
    urlList = parsed;
  } else if (typeof parsed === 'string') {
    urlList = [parsed];
  }
} catch (e) {
  if (process.env.FE_URL) {
    urlList = [process.env.FE_URL];
  }
}

const defaultPorts = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"];
defaultPorts.forEach(port => {
  if (!urlList.includes(port)) {
    urlList.push(port);
  }
});
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
