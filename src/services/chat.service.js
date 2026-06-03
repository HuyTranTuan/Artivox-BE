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

// Customer gets or creates unassigned room (adminId = null)
async function getOrCreateUnassignedRoom(customerId) {
  // First, try to find an existing unassigned room for this customer
  let room = await prisma.chatRoom.findFirst({
    where: { customerId: BigInt(customerId), adminId: null, isActive: true },
    include: { admin: { select: { id: true, fullName: true } } },
  });

  if (room) {
    // Update existing room
    room = await prisma.chatRoom.update({
      where: { id: room.id },
      data: { isActive: true },
      include: { admin: { select: { id: true, fullName: true } } },
    });
    return room;
  }

  // Check if there's an existing inactive unassigned room to reactivate
  const inactiveRoom = await prisma.chatRoom.findFirst({
    where: { customerId: BigInt(customerId), adminId: null, isActive: false },
  });

  if (inactiveRoom) {
    room = await prisma.chatRoom.update({
      where: { id: inactiveRoom.id },
      data: { isActive: true },
      include: { admin: { select: { id: true, fullName: true } } },
    });
    return room;
  }

  // Create new unassigned room
  return prisma.chatRoom.create({
    data: { customerId: BigInt(customerId) },
    include: { admin: { select: { id: true, fullName: true } } },
  });
}

// Get staff/admin chat rooms (including unassigned)
async function getAdminRooms(adminId) {
  return prisma.chatRoom.findMany({
    where: { 
      isActive: true,
      OR: [
        { adminId: BigInt(adminId) },
        { adminId: null }
      ]
    },
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

// Get messages in a room (verify caller is a participant or room is unassigned)
async function getMessages(chatRoomId, userId) {
  const room = await prisma.chatRoom.findFirst({
    where: {
      id: BigInt(chatRoomId),
      OR: [{ adminId: BigInt(userId) }, { customerId: BigInt(userId) }, { adminId: null }],
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
  if (!room) return null; 

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
    include: { chatRoom: true },
  });

  await prisma.chatRoom.update({ where: { id: BigInt(chatRoomId) }, data: { updatedAt: new Date() } });

  // Notify recipient
  const recipientId = senderType === "STAFF" ? room.customerId : room.adminId;
  const senderName = senderType === "STAFF" ? "Staff" : "Customer";
  
  if (recipientId) {
    await notificationService.createNotification(recipientId, senderType === "STAFF" ? "CUSTOMER" : "STAFF", {
      type: "CHAT_MESSAGE",
      title: `New message from ${senderName}`,
      message: fileUrl ? `${senderName} sent a ${fileType || "file"}` : content,
      metadata: { chatRoomId, messageId: message.id.toString(), senderId: senderType === "STAFF" ? adminId : customerId },
    });
  }

  return message;
}

// Claim an unassigned room by a staff member
async function claimRoom(chatRoomId, staffId) {
  const room = await prisma.chatRoom.findUnique({ where: { id: BigInt(chatRoomId) } });
  if (!room) throw new AppError("Room not found", HTTP_CODES.NOT_FOUND);

  if (room.adminId !== null) {
    if (room.adminId === BigInt(staffId)) {
      // already claimed by this staff
      return prisma.chatRoom.findUnique({ 
        where: { id: BigInt(chatRoomId) }, 
        include: { customer: { select: { id: true, fullName: true, slug: true } } } 
      });
    }
  }

  // Check if staff already has a DIFFERENT room with this customer.
  const existingRoom = await prisma.chatRoom.findUnique({
    where: { adminId_customerId: { adminId: BigInt(staffId), customerId: room.customerId } },
  });

  // Run merge + claim atomically
  const updatedRoom = await prisma.$transaction(async (tx) => {
    if (existingRoom && existingRoom.id !== room.id) {
      // Move all messages from the unassigned room into the old assigned room
      await tx.chatMessage.updateMany({
        where: { chatRoomId: room.id },
        data: { chatRoomId: existingRoom.id },
      });
      // Delete the unassigned room
      await tx.chatRoom.delete({ where: { id: room.id } });
      
      return tx.chatRoom.update({
        where: { id: existingRoom.id },
        data: { updatedAt: new Date() },
        include: { customer: { select: { id: true, fullName: true, slug: true } } },
      });
    }

    return tx.chatRoom.update({
      where: { id: room.id },
      data: { adminId: BigInt(staffId), updatedAt: new Date() },
      include: { customer: { select: { id: true, fullName: true, slug: true } } },
    });
  });

  return updatedRoom;
}

// Mark unread messages as read
async function markAsRead(chatRoomId, readerType) {
  const oppositeType = readerType === "STAFF" ? "CUSTOMER" : "STAFF";
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

// ─── INTERNAL CHAT (Admin to Admin/Staff) ───────────────────

async function getInternalUsers(adminId) {
  return prisma.adminUser.findMany({
    where: { deletedAt: null, id: { not: BigInt(adminId) } },
    select: { id: true, email: true, fullName: true, role: true, avatar: true },
  });
}

async function getInternalRooms(adminId) {
  return prisma.internalChatRoom.findMany({
    where: {
      isActive: true,
      OR: [
        { participant1Id: BigInt(adminId) },
        { participant2Id: BigInt(adminId) }
      ]
    },
    include: {
      participant1: { select: { id: true, fullName: true, email: true, avatar: true, role: true } },
      participant2: { select: { id: true, fullName: true, email: true, avatar: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

async function getOrCreateInternalRoom(participant1Id, participant2Id) {
  // Sort IDs so p1 is always smaller than p2 to avoid duplicates
  const p1 = Math.min(Number(participant1Id), Number(participant2Id));
  const p2 = Math.max(Number(participant1Id), Number(participant2Id));

  return prisma.internalChatRoom.upsert({
    where: { participant1Id_participant2Id: { participant1Id: BigInt(p1), participant2Id: BigInt(p2) } },
    update: { isActive: true },
    create: { participant1Id: BigInt(p1), participant2Id: BigInt(p2) },
    include: {
      participant1: { select: { id: true, fullName: true, email: true, avatar: true, role: true } },
      participant2: { select: { id: true, fullName: true, email: true, avatar: true, role: true } },
    },
  });
}

async function getInternalMessages(roomId, adminId) {
  const room = await prisma.internalChatRoom.findFirst({
    where: {
      id: BigInt(roomId),
      OR: [
        { participant1Id: BigInt(adminId) },
        { participant2Id: BigInt(adminId) }
      ]
    },
  });
  if (!room) throw new AppError("Internal room not found", HTTP_CODES.NOT_FOUND);

  return prisma.internalChatMessage.findMany({
    where: { roomId: BigInt(roomId) },
    orderBy: { createdAt: "asc" },
  });
}

async function sendInternalMessage(roomId, { senderId, content, fileUrl, fileType }) {
  const room = await prisma.internalChatRoom.findUnique({ where: { id: BigInt(roomId) } });
  if (!room) return null;

  const message = await prisma.internalChatMessage.create({
    data: {
      roomId: BigInt(roomId),
      senderId: BigInt(senderId),
      content,
      fileUrl: fileUrl || null,
      fileType: fileType || null,
    },
    include: { room: true },
  });

  await prisma.internalChatRoom.update({ where: { id: BigInt(roomId) }, data: { updatedAt: new Date() } });

  // Notify recipient
  const recipientId = room.participant1Id === BigInt(senderId) ? room.participant2Id : room.participant1Id;
  const sender = await prisma.adminUser.findUnique({ where: { id: BigInt(senderId) }, select: { fullName: true } });
  const senderName = sender?.fullName || "Colleague";

  await notificationService.createNotification(recipientId, "STAFF", {
    type: "INTERNAL_MESSAGE",
    title: `New message from ${senderName}`,
    message: fileUrl ? `${senderName} sent a ${fileType || "file"}` : content,
    metadata: { roomId, messageId: message.id.toString(), senderId },
  });

  return message;
}

async function markInternalAsRead(roomId, readerId) {
  return prisma.internalChatMessage.updateMany({
    where: { roomId: BigInt(roomId), senderId: { not: BigInt(readerId) }, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { 
  getOrCreateRoom, getOrCreateUnassignedRoom, claimRoom, getAdminRooms, getCustomerRooms, getMessages, sendMessage, markAsRead, aiChat, aiChatStreamTokens,
  getInternalUsers, getInternalRooms, getOrCreateInternalRoom, getInternalMessages, sendInternalMessage, markInternalAsRead
};
