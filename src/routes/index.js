const express = require("express");

const authRoutes = require("@routes/auth.route");
const catalogRoutes = require("@routes/catalog.route");
const cartRoutes = require("@routes/cart.route");
const orderRoutes = require("@routes/order.route");
const articleRoutes = require("@routes/article.route");
const adminRoutes = require("@routes/admin.route");
const chatRoutes = require("@routes/chat.route");

const router = express.Router();

router.get("/health", (req, res) => {
  res.success({ service: "artivox-be", status: "ok" }, "Service healthy");
});

router.use("/auth", authRoutes);
router.use("/", catalogRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/", articleRoutes);
router.use("/admin", adminRoutes);
router.use("/chat", chatRoutes);

module.exports = router;
