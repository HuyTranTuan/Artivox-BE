const { prisma } = require("@libs/prisma");
const notificationService = require("@services/notification.service");

// Get or create chat room
async function getOrCreateRoom(adminId, customerId) {
  return prisma.chatRoom.upsert({
    where: { adminId_customerId: { adminId, customerId } },
    update: { isActive: true },
    create: { adminId, customerId },
    include: { customer: { select: { id: true, fullName: true, slug: true } } },
  });
}

// Get admin's chat rooms
async function getAdminRooms(adminId) {
  return prisma.chatRoom.findMany({
    where: { adminId, isActive: true },
    include: {
      customer: { select: { id: true, fullName: true, email: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get customer's chat rooms
async function getCustomerRooms(customerId) {
  return prisma.chatRoom.findMany({
    where: { customerId, isActive: true },
    include: {
      admin: { select: { id: true, fullName: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get messages in room
async function getMessages(chatRoomId, userId) {
  const room = await prisma.chatRoom.findFirst({
    where: { id: BigInt(chatRoomId), OR: [{ adminId: BigInt(userId) }, { customerId: BigInt(userId) }] },
  });
  if (!room) return res.notFound();

  return prisma.chatMessage.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: "asc" },
  });
}

// Send message with optional file/image
async function sendMessage(chatRoomId, { senderType, adminId, customerId, content, fileUrl, fileType }) {
  const room = await prisma.chatRoom.findUnique({ where: { id: BigInt(chatRoomId) } });
  if (!room) return res.notFound();

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId,
      senderType,
      adminId,
      customerId,
      content,
      fileUrl: fileUrl || null,
      fileType: fileType || null, // 'IMAGE' or 'FILE'
    },
  });

  // Update chat room's updatedAt
  await prisma.chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() },
  });

  // Send notification to the recipient
  const recipientId = senderType === "ADMIN" ? room.customerId : room.adminId;
  const senderName = senderType === "ADMIN" ? "Admin" : "Customer";

  await notificationService.createNotification(recipientId, senderType === "ADMIN" ? "CUSTOMER" : "ADMIN", {
    type: "CHAT_MESSAGE",
    title: `New message from ${senderName}`,
    message: fileUrl ? `${senderName} sent a ${fileType || "file"}` : content,
    metadata: { chatRoomId, messageId: message.id, senderId: senderType === "ADMIN" ? adminId : customerId },
  });

  return message;
}

// Mark messages as read
async function markAsRead(chatRoomId, readerType) {
  const oppositeType = readerType === "ADMIN" ? "CUSTOMER" : "ADMIN";
  return prisma.chatMessage.updateMany({
    where: { chatRoomId: BigInt(chatRoomId), senderType: oppositeType, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { getOrCreateRoom, getAdminRooms, getCustomerRooms, getMessages, sendMessage, markAsRead };
