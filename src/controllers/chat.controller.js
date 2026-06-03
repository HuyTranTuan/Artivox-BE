const chatService = require("@services/chat.service");
const imageService = require("@services/image.service");
const notificationService = require("@services/notification.service");
const catchAsync = require("@utils/catchAsync");

/**
 * Helper — check if a user is currently subscribed to a specific chat room.
 * Socket.io tracks which rooms each socket is in via `socket.rooms` (a Set).
 */
function isUserInChatRoom(io, namespace, userId, role, chatRoomId) {
  const ns = io.of(namespace);
  const personalRoom = `user:${role}:${userId}`;
  const chatRoom = chatRoomId.startsWith("internal:") ? `room:${chatRoomId}` : `room:chat:${chatRoomId}`;

  for (const [, socket] of ns.sockets) {
    if (socket.rooms.has(personalRoom) && socket.rooms.has(chatRoom)) {
      return true;
    }
  }
  return false;
}

/**
 * Helper — check if a user has ANY active socket in /notifications namespace.
 */
function isUserOnline(io, userId, role) {
  const ns = io.of("/notifications");
  const personalRoom = `user:${role}:${userId}`;
  for (const [, socket] of ns.sockets) {
    if (socket.rooms.has(personalRoom)) return true;
  }
  return false;
}

// GET /chat/rooms
const getMyRooms = catchAsync(async (req, res) => {
  const data =
    req.user.type === "admin"
      ? await chatService.getAdminRooms(req.user.id)
      : await chatService.getCustomerRooms(req.user.id);
  return res.success(data, "Chat rooms fetched");
});

// POST /chat/rooms
const getOrCreateRoom = catchAsync(async (req, res) => {
  if (req.user.type === "admin") {
    const { customerId } = req.body;
    if (!customerId) return res.error("customerId required", 400);
    const data = await chatService.getOrCreateRoom(req.user.id, customerId);
    return res.success(data, "Chat room ready");
  } else {
    // Check if the customer already has an active room (assigned or unassigned)
    const existingRooms = await chatService.getCustomerRooms(req.user.id);
    if (existingRooms && existingRooms.length > 0) {
      // Prioritize the assigned room if they have one, otherwise return the first one
      const assignedRoom = existingRooms.find((r) => r.adminId !== null);
      return res.success(assignedRoom || existingRooms[0], "Chat room ready");
    }
    
    // Otherwise, create an unassigned room
    const data = await chatService.getOrCreateUnassignedRoom(req.user.id);
    return res.success(data, "Chat room ready");
  }
});

// POST /chat/rooms/:roomId/claim
const claimRoom = catchAsync(async (req, res) => {
  if (req.user.type !== "admin") return res.error("Unauthorized", 403);
  const oldRoomId = req.params.roomId;
  const data = await chatService.claimRoom(oldRoomId, req.user.id);

  const newRoomId = data.id.toString();
  if (oldRoomId !== newRoomId) {
    const io = req.app.get("io");
    if (io) {
      io.of("/chat").to(`room:chat:${oldRoomId}`).emit("room_merged", {
        oldRoomId,
        newRoomId
      });
    }
  }

  return res.success(data, "Room claimed successfully");
});

// GET /chat/rooms/:roomId/messages
const getMessages = catchAsync(async (req, res) => {
  const data = await chatService.getMessages(req.params.roomId, req.user.id);
  return res.success(data, "Messages fetched");
});

/**
 * POST /chat/rooms/:roomId/messages
 *
 * Hybrid flow:
 * 1. Persist message via Prisma
 * 2a. If recipient is in the chat room → emit `new_message` to room
 * 2b. If recipient is online but NOT in room → emit `new_notification` to personal room
 * 2c. If recipient is offline → triggerPushNotification() placeholder
 */
const sendMessage = catchAsync(async (req, res) => {
  const isAdmin = req.user.type === "admin";
  const { content, fileUrl, fileType } = req.body;
  const chatRoomId = req.params.roomId;

  let uploadedFileUrl = fileUrl;
  if (fileUrl && fileUrl.startsWith("data:")) {
    const fileName = content && content !== "File" ? content : "attachment";
    uploadedFileUrl = await imageService.uploadChatAttachment(fileUrl, fileName, fileType, chatRoomId);
  }

  const data = await chatService.sendMessage(chatRoomId, {
    senderType: isAdmin ? "STAFF" : "CUSTOMER",
    adminId: isAdmin ? req.user.id : null,
    customerId: isAdmin ? null : req.user.id,
    content,
    fileUrl: uploadedFileUrl,
    fileType,
  });

  if (!data) return res.error("Room not found", 404);

  const io = req.app.get("io");
  if (io) {
    const room = data.chatRoom;
    const recipientId = isAdmin
      ? room.customerId?.toString()
      : room.adminId?.toString();
    const recipientRole = isAdmin ? "CUSTOMER" : "STAFF";

    // Serialize message for wire
    const serialized = {
      ...data,
      id: data.id?.toString(),
      chatRoomId: data.chatRoomId?.toString(),
      adminId: data.adminId?.toString() ?? null,
      customerId: data.customerId?.toString() ?? null,
      chatRoom: undefined,
    };

    // Always push to the chat room channel (sender + anyone watching the room)
    io.of("/chat")
      .to(`room:chat:${chatRoomId}`)
      .emit("new_message", serialized);

    // Notification routing for the recipient
    if (recipientId) {
      const inRoom = isUserInChatRoom(
        io,
        "/chat",
        recipientId,
        recipientRole,
        chatRoomId,
      );

      if (!inRoom) {
        const online = isUserOnline(io, recipientId, recipientRole);
        if (online) {
          // Online but not in room → send notification ping
          io.of("/notifications")
            .to(`user:${recipientRole}:${recipientId}`)
            .emit("new_notification", {
              type: "CHAT_MESSAGE",
              title: isAdmin
                ? "New message from support"
                : "New message from customer",
              message: content?.substring(0, 80) || "Sent a file",
              chatRoomId,
            });
        } else {
          // Offline → placeholder for push notification
          triggerPushNotification(recipientId, recipientRole, {
            title: isAdmin
              ? "New message from support"
              : "New message from customer",
            body: content?.substring(0, 100) || "Sent a file",
            data: { chatRoomId },
          });
        }
      }
    } else if (!isAdmin) {
      // Unassigned room → notify all staff
      io.of("/notifications")
        .to("admin_room")
        .emit("new_notification", {
          type: "CHAT_MESSAGE",
          title: "New incoming support request",
          message: content?.substring(0, 80) || "Sent a file",
          chatRoomId,
          customerId: String(req.user.id),
        });
    }
  }

  return res.success(data, "Message sent", 201);
});

/**
 * PATCH /chat/rooms/:roomId/read
 * Marks all messages sent to the current user as read,
 * then emits `messages_read` to the original sender.
 */
const markAsRead = catchAsync(async (req, res) => {
  const readerType = req.user.type === "admin" ? "STAFF" : "CUSTOMER";
  const chatRoomId = req.params.roomId;

  await chatService.markAsRead(chatRoomId, readerType);
  await notificationService.markChatNotificationsAsRead(chatRoomId, req.user.id, readerType);

  const io = req.app.get("io");
  if (io) {
    // Notify the sender side that their messages have been read
    io.of("/chat")
      .to(`room:chat:${chatRoomId}`)
      .emit("messages_read", { chatRoomId, readerType });
      
    // Notify the reader that their notifications are read so UI updates
    io.of("/notifications")
      .to(`user:${readerType}:${req.user.id}`)
      .emit("notifications_read", { chatRoomId });
  }

  return res.success(null, "Marked as read");
});

/**
 * Placeholder for push notification service (e.g. Firebase Cloud Messaging).
 * Replace this with your actual FCM / APNs implementation.
 */
function triggerPushNotification(recipientId, role, { title, body, data }) {
  console.log(
    `[Push] Would send push to ${role}:${recipientId} — "${title}": "${body}"`,
    data,
  );
}

// POST /chat/ai — standalone AI chat (SSE streaming)
const aiChat = async (req, res) => {
  const { message, history } = req.body;
  if (!message?.trim()) return res.error("message required", 400);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.socket) res.socket.setNoDelay(true);
  res.flushHeaders();

  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    const tokenStream = chatService.aiChatStreamTokens(message, history || []);
    for await (const token of tokenStream) {
      if (aborted) break;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    if (!aborted) res.write("data: [DONE]\n\n");
  } catch (error) {
    console.error("AI chat stream error:", error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    }
  } finally {
    if (!res.writableEnded) res.end();
  }
};

// ─── INTERNAL CHAT (Admin to Admin/Staff) ───────────────────

const getInternalUsers = catchAsync(async (req, res) => {
  const data = await chatService.getInternalUsers(req.user.id);
  return res.success(data, "Internal users fetched");
});

const getInternalRooms = catchAsync(async (req, res) => {
  const data = await chatService.getInternalRooms(req.user.id);
  return res.success(data, "Internal chat rooms fetched");
});

const getOrCreateInternalRoom = catchAsync(async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) return res.error("participantId required", 400);
  const data = await chatService.getOrCreateInternalRoom(req.user.id, participantId);
  return res.success(data, "Internal chat room ready");
});

const getInternalMessages = catchAsync(async (req, res) => {
  const data = await chatService.getInternalMessages(req.params.roomId, req.user.id);
  return res.success(data, "Internal messages fetched");
});

const sendInternalMessage = catchAsync(async (req, res) => {
  const { content, fileUrl, fileType } = req.body;
  const chatRoomId = req.params.roomId;

  let uploadedFileUrl = fileUrl;
  if (fileUrl && fileUrl.startsWith("data:")) {
    const fileName = content && content !== "File" ? content : "attachment";
    uploadedFileUrl = await imageService.uploadChatAttachment(fileUrl, fileName, fileType, `internal-${chatRoomId}`);
  }

  const data = await chatService.sendInternalMessage(chatRoomId, {
    senderId: req.user.id,
    content,
    fileUrl: uploadedFileUrl,
    fileType,
  });

  if (!data) return res.error("Room not found", 404);

  const io = req.app.get("io");
  if (io) {
    const room = data.room;
    const recipientId = room.participant1Id.toString() === req.user.id.toString() 
      ? room.participant2Id.toString() 
      : room.participant1Id.toString();

    const serialized = {
      ...data,
      id: data.id?.toString(),
      roomId: data.roomId?.toString(),
      senderId: data.senderId?.toString(),
      room: undefined,
    };

    io.of("/chat").to(`room:internal:${chatRoomId}`).emit("new_internal_message", serialized);

    const inRoom = isUserInChatRoom(io, "/chat", recipientId, "STAFF", `internal:${chatRoomId}`);
    if (!inRoom) {
      const online = isUserOnline(io, recipientId, "STAFF");
      if (online) {
        io.of("/notifications").to(`user:STAFF:${recipientId}`).emit("new_notification", {
          type: "INTERNAL_MESSAGE",
          title: "New internal message",
          message: content?.substring(0, 80) || "Sent a file",
          roomId: chatRoomId,
        });
      }
    }
  }

  return res.success(data, "Internal message sent", 201);
});

const markInternalAsRead = catchAsync(async (req, res) => {
  const chatRoomId = req.params.roomId;
  await chatService.markInternalAsRead(chatRoomId, req.user.id);
  await notificationService.markChatNotificationsAsRead(chatRoomId, req.user.id, "STAFF");

  const io = req.app.get("io");
  if (io) {
    io.of("/chat").to(`room:internal:${chatRoomId}`).emit("internal_messages_read", { chatRoomId, readerId: req.user.id });
    io.of("/notifications").to(`user:STAFF:${req.user.id}`).emit("notifications_read", { roomId: chatRoomId });
  }

  return res.success(null, "Marked as read");
});

module.exports = {
  getMyRooms,
  getOrCreateRoom,
  claimRoom,
  getMessages,
  sendMessage,
  markAsRead,
  aiChat,
  getInternalUsers,
  getInternalRooms,
  getOrCreateInternalRoom,
  getInternalMessages,
  sendInternalMessage,
  markInternalAsRead,
};
