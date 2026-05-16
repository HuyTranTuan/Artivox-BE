const express = require("express");
const notificationController = require("@controllers/notification.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get all notifications for current user
router.get("/", notificationController.getNotifications);

// Get unread count
router.get("/unread-count", notificationController.getUnreadCount);

// Get single notification
router.get("/:id", notificationController.getNotificationById);

// Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
