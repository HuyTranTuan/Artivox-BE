const { prisma } = require("@libs/prisma");
const AppError = require("@utils/AppError");

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
    where: { id: chatRoomId, OR: [{ adminId: userId }, { customerId: userId }] },
  });
  if (!room) throw new AppError("Chat room not found", 404);

  return prisma.chatMessage.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: "asc" },
  });
}

// Send message
async function sendMessage(chatRoomId, { senderType, adminId, customerId, content }) {
  const room = await prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!room) throw new AppError("Chat room not found", 404);

  const message = await prisma.chatMessage.create({
    data: { chatRoomId, senderType, adminId, customerId, content },
  });

  await prisma.chatRoom.update({ where: { id: chatRoomId }, data: { updatedAt: new Date() } });

  return message;
}

// Mark messages as read
async function markAsRead(chatRoomId, readerType) {
  const oppositeType = readerType === "ADMIN" ? "CUSTOMER" : "ADMIN";
  return prisma.chatMessage.updateMany({
    where: { chatRoomId, senderType: oppositeType, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { getOrCreateRoom, getAdminRooms, getCustomerRooms, getMessages, sendMessage, markAsRead };
