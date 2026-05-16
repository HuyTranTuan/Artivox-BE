const notificationService = require("@services/notification.service");
const catchAsync = require("@utils/catchAsync");

const getNotifications = catchAsync(async (req, res) => {
  const { limit = 20, offset = 0, isRead } = req.query;
  const recipientType = req.user.type === "admin" ? "ADMIN" : "CUSTOMER";

  const data = await notificationService.getNotifications(req.user.id, recipientType, {
    limit: parseInt(limit),
    offset: parseInt(offset),
    isRead: isRead ? isRead === "true" : undefined,
  });

  return res.success(data, "Notifications fetched");
});

const getUnreadCount = catchAsync(async (req, res) => {
  const recipientType = req.user.type === "admin" ? "ADMIN" : "CUSTOMER";
  const count = await notificationService.getUnreadCount(req.user.id, recipientType);

  return res.success({ unreadCount: count }, "Unread count fetched");
});

const getNotificationById = catchAsync(async (req, res) => {
  const data = await notificationService.getNotificationById(BigInt(req.params.id));
  if (!data) return res.notFound();

  return res.success(data, "Notification fetched");
});

const markAsRead = catchAsync(async (req, res) => {
  const data = await notificationService.markAsRead(BigInt(req.params.id));
  return res.success(data, "Notification marked as read");
});

const markAllAsRead = catchAsync(async (req, res) => {
  const recipientType = req.user.type === "admin" ? "ADMIN" : "CUSTOMER";
  await notificationService.markMultipleAsRead(req.user.id, recipientType);

  return res.success(null, "All notifications marked as read");
});

const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification(BigInt(req.params.id));
  return res.success(null, "Notification deleted");
});

module.exports = {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
