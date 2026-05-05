const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Load environment variables
dotenv.config();

// Import middlewares
const { errorMiddleware } = require("@middlewares/error.middleware");
const { responseMiddleware } = require("@middlewares/response.middleware");

// Import routes
const apiRoutes = require("@routes/index");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || "").split(","),
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom response helpers
app.use(responseMiddleware);

// API routes
app.use("/api/v1", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
    path: req.path,
  });
});

// Global error handler
app.use(errorMiddleware);

module.exports = app;
