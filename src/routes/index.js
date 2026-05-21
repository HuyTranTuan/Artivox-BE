const express = require("express");

const authRoutes = require("@routes/auth.route");
const catalogRoutes = require("@routes/catalog.route");
const cartRoutes = require("@routes/cart.route");
const orderRoutes = require("@routes/order.route");
const articleRoutes = require("@routes/article.route");
const adminRoutes = require("@routes/admin.route");
const chatRoutes = require("@routes/chat.route");
const customerRoutes = require("@routes/customer.route");
const discountRoutes = require("@routes/discount.route");
const discountOrderRoutes = require("@routes/discountOrder.route");
const customerActivityLogRoutes = require("@routes/customerActivityLog.route");
const notificationRoutes = require("@routes/notification.route");
const searchRoutes = require("@routes/search.route");

const router = express.Router();

//////// Authorization /////////
router.use("/auth", authRoutes);

/////////// Admin /////////////
router.use("/admin", adminRoutes);

router.use("/catalog", catalogRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/articles", articleRoutes);
router.use("/chat", chatRoutes);
router.use("/customers", customerRoutes);
router.use("/discounts", discountRoutes);
router.use("/discount_orders", discountOrderRoutes);
router.use("/customer-activity-log", customerActivityLogRoutes);
router.use("/notifications", notificationRoutes);
router.use("/search", searchRoutes);

module.exports = router;
