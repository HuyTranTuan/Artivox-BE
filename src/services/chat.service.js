const { prisma } = require("@libs/prisma");
const AppError = require("@utils/AppError");
const { HTTP_CODES } = require("@config/constants");
const notificationService = require("@services/notification.service");
const { generateAIResponse, streamAITokens, buildConversationContext } = require("@services/ai.service");

// Get or create chat room (staff creates with customerId, room "named" by customerId)
async function getOrCreateRoom(staffId, customerId) {
  return prisma.chatRoom.upsert({
    where: { adminId_customerId: { adminId: BigInt(staffId), customerId: BigInt(customerId) } },
    update: { isActive: true },
    create: { adminId: BigInt(staffId), customerId: BigInt(customerId) },
    include: { customer: { select: { id: true, fullName: true, slug: true } } },
  });
}

// Get staff/admin chat rooms
async function getAdminRooms(adminId) {
  return prisma.chatRoom.findMany({
    where: { adminId: BigInt(adminId), isActive: true },
    include: {
      customer: { select: { id: true, fullName: true, email: true, slug: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get customer's chat room(s)
async function getCustomerRooms(customerId) {
  return prisma.chatRoom.findMany({
    where: { customerId: BigInt(customerId), isActive: true },
    include: {
      admin: { select: { id: true, fullName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// Get messages in a room (verify caller is a participant)
async function getMessages(chatRoomId, userId) {
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: BigInt(chatRoomId),
      OR: [{ adminId: BigInt(userId) }, { customerId: BigInt(userId) }],
    },
  });
  if (!room) throw new AppError("Room not found", HTTP_CODES.NOT_FOUND);

  return prisma.chatMessage.findMany({
    where: { chatRoomId: BigInt(chatRoomId) },
    orderBy: { createdAt: "asc" },
  });
}

// Send message; non-blocking AI auto-reply when CUSTOMER sends text
async function sendMessage(chatRoomId, { senderType, adminId, customerId, content, fileUrl, fileType }) {
  const room = await prisma.chatRoom.findUnique({ where: { id: BigInt(chatRoomId) } });
  if (!room) throw new AppError("Room not found", HTTP_CODES.NOT_FOUND);

  const message = await prisma.chatMessage.create({
    data: {
      chatRoomId: BigInt(chatRoomId),
      senderType,
      adminId: adminId ? BigInt(adminId) : null,
      customerId: customerId ? BigInt(customerId) : null,
      content,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
    },
  });

  await prisma.chatRoom.update({ where: { id: BigInt(chatRoomId) }, data: { updatedAt: new Date() } });

  // Notify recipient
  const recipientId = senderType === "ADMIN" ? room.customerId : room.adminId;
  const senderName = senderType === "ADMIN" ? "Staff" : "Customer";
  await notificationService.createNotification(recipientId, senderType === "ADMIN" ? "CUSTOMER" : "ADMIN", {
    type: "CHAT_MESSAGE",
    title: `New message from ${senderName}`,
    message: fileUrl ? `${senderName} sent a ${fileType || "file"}` : content,
    metadata: { chatRoomId, messageId: message.id.toString(), senderId: senderType === "ADMIN" ? adminId : customerId },
  });

  return message;
}

// Mark unread messages as read
async function markAsRead(chatRoomId, readerType) {
  const oppositeType = readerType === "ADMIN" ? "CUSTOMER" : "ADMIN";
  return prisma.chatMessage.updateMany({
    where: { chatRoomId: BigInt(chatRoomId), senderType: oppositeType, isRead: false },
    data: { isRead: true },
  });
}

// Standalone AI chat (no room — used by AIChatPanel)
async function aiChat(message, history = []) {
  const context = buildConversationContext(history);
  const reply = await generateAIResponse(message, context);
  return reply;
}

// Standalone AI chat stream — returns an async generator yielding tokens
function aiChatStreamTokens(message, history = []) {
  const context = buildConversationContext(history);
  return streamAITokens(message, context);
}

module.exports = { getOrCreateRoom, getAdminRooms, getCustomerRooms, getMessages, sendMessage, markAsRead, aiChat, aiChatStreamTokens };
