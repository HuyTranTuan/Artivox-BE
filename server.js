require("dotenv").config();
require("module-alias/register");
require("./polyfill");

//////////// Libraries declaration ////////////
const express = require("express");
const cors = require("cors");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

//////////// Middlewares declaration ////////////
const { errorMiddleware } = require("@middlewares/error.middleware");
const { notfoundMiddleware } = require("@/middlewares/notfound.middleware");
const { responseMiddleware } = require("@middlewares/response.middleware");
const { apiLimiter } = require("@middlewares/ratelimit.middleware");
const beLandingPage = require("@/utils/beLandingPage");
const apiRoutes = require("@routes/index");

//////////// Utilities ////////////
const { corsConfig, socketCorsConfig } = require("@/config/corsConfig");
const socketNotification = require("@/routes/socket/connection.route");
const socketChat = require("@/routes/socket/chat.route");

//////////// App + Socket.io ////////////
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: socketCorsConfig });

// Expose io to Express controllers via req.app.get("io")
app.set("io", io);

//////////// Variables ////////////
const hostname = process.env.APP_HOST || "127.0.0.1";
const port = process.env.APP_PORT || 3000;

//////////// Middlewares ////////////
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(responseMiddleware);

//////////// REST Routes ////////////
app.get("/", beLandingPage);
app.use("/api", apiLimiter);
app.use("/api/v1", apiRoutes);

//////////// Socket.io Namespaces ////////////
const { socketAuthMiddleware } = require("@middlewares/socket.middleware");

const chatNs = io.of("/chat");
chatNs.use(socketAuthMiddleware);
chatNs.on("connection", socketChat);

const notifNs = io.of("/notifications");
notifNs.use(socketAuthMiddleware);
notifNs.on("connection", socketNotification);

//////////// Error Handlers ////////////
app.use(errorMiddleware);
app.use(notfoundMiddleware);

const { startCronJobs } = require("@services/cron.service");

server.listen(port, hostname, () => {
  console.log(`\n🚀 Server running on http://${hostname}:${port}`);
  startCronJobs();
});
