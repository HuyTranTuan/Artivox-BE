const { prisma } = require("@libs/prisma");

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

// Send message
async function sendMessage(chatRoomId, { senderType, adminId, customerId, content }) {
  const room = await prisma.chatRoom.findUnique({ where: { id: BigInt(chatRoomId) } });
  if (!room) return res.notFound();

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
    where: { chatRoomId: BigInt(chatRoomId), senderType: oppositeType, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { getOrCreateRoom, getAdminRooms, getCustomerRooms, getMessages, sendMessage, markAsRead };
