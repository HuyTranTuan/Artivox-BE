const { prisma } = require("@libs/prisma");

// Create notification
async function createNotification(recipientId, recipientType, { type, title, message, metadata }) {
  const isAdmin = recipientType === "ADMIN";
  return prisma.notification.create({
    data: {
      type,
      adminId: isAdmin ? BigInt(recipientId) : null,
      customerId: !isAdmin ? BigInt(recipientId) : null,
      title,
      message,
      metadata: metadata || {},
    },
  });
}

// Get notifications for user/admin
async function getNotifications(recipientId, recipientType, { limit = 20, offset = 0, isRead } = {}) {
  const isAdmin = recipientType === "ADMIN";
  const where = {
    adminId: isAdmin ? BigInt(recipientId) : null,
    customerId: !isAdmin ? BigInt(recipientId) : null,
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
  const isAdmin = recipientType === "ADMIN";
  return prisma.notification.count({
    where: {
      adminId: isAdmin ? BigInt(recipientId) : null,
      customerId: !isAdmin ? BigInt(recipientId) : null,
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
  const isAdmin = recipientType === "ADMIN";
  return prisma.notification.updateMany({
    where: {
      adminId: isAdmin ? BigInt(recipientId) : null,
      customerId: !isAdmin ? BigInt(recipientId) : null,
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

// Notify Staff about New Order via Socket
async function notifyStaffOrderCreated(orderId, io) {
  if (io) {
    io.to("admin_room").emit("new_order", { orderId, message: `New order #${orderId} created.` });
  }
}

// Notify Staff about New Message via Socket
async function notifyStaffNewMessage(chatRoomId, message, io) {
  if (io) {
    io.to("admin_room").emit("new_message", { chatRoomId, message });
  }
}

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  getNotificationById,
  deleteNotification,
  notifyStaffOrderCreated,
  notifyStaffNewMessage,
};
