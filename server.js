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
const beLandingPage = require("@/utils/beLandingPage");
const apiRoutes = require("@routes/index");

//////////// Uitlities ////////////
const { corsConfig, socketCorsConfig } = require("@/config/corsConfig");
const socketNotification = require("@/routes/socket/connection.route");
const socketChat = require("@/routes/socket/chat.route");

//////////// App create and socket.io ////////////
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: socketCorsConfig,
});

//////////// Variables ////////////
const hostname = process.env.APP_HOST || "127.0.0.1";
const port = process.env.APP_PORT || 3000;

//////////// Use Middleware ///////////////
app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseMiddleware);

//////////// Routings ////////////
app.get("/", beLandingPage);
app.use("/api/v1", apiRoutes);

//////////// Socket.io ////////////
// const chatNs = io.of("/chat");
// chatNs.on("connection", socketChat);
// const notifNs = io.of("/notifications");
// notifNs.on("connection", socketNotification);

const { startCronJobs } = require("@services/cron.service");

//////////// Error Handler ////////////
app.use(errorMiddleware);
app.use(notfoundMiddleware);

app.listen(port, () => {
  console.log(`\n🚀 Server running on http://${hostname}:${port}`);
  startCronJobs();
});
