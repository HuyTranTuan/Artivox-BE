const { prisma } = require("@libs/prisma");

// Create notification
async function createNotification(recipientId, recipientType, { type, title, message, metadata }) {
  return prisma.notification.create({
    data: {
      type,
      recipientId,
      recipientType,
      title,
      message,
      metadata: metadata || {},
    },
  });
}

// Get notifications for user/admin
async function getNotifications(recipientId, recipientType, { limit = 20, offset = 0, isRead } = {}) {
  const where = {
    recipientId,
    recipientType,
    ...(isRead !== undefined && { isRead }),
  };

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

// Get unread count
async function getUnreadCount(recipientId, recipientType) {
  return prisma.notification.count({
    where: {
      recipientId,
      recipientType,
      isRead: false,
    },
  });
}

// Mark as read
async function markAsRead(notificationId) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

// Mark multiple as read
async function markMultipleAsRead(recipientId, recipientType) {
  return prisma.notification.updateMany({
    where: {
      recipientId,
      recipientType,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

// Get notification by id
async function getNotificationById(notificationId) {
  return prisma.notification.findUnique({
    where: { id: notificationId },
  });
}

// Delete notification
async function deleteNotification(notificationId) {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  getNotificationById,
  deleteNotification,
};
