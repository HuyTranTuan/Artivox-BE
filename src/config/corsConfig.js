let urlList = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .map(origin => origin.replace(/\/$/, ""))
  .filter(Boolean);

const defaultPorts = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080"
];

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