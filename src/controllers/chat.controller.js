const chatService = require("@services/chat.service");
const catchAsync = require("@utils/catchAsync");

// GET /chat/rooms — customer gets their rooms, staff gets all their rooms
const getMyRooms = catchAsync(async (req, res) => {
  const data = req.user.type === "admin"
    ? await chatService.getAdminRooms(req.user.id)
    : await chatService.getCustomerRooms(req.user.id);
  return res.success(data, "Chat rooms fetched");
});

// POST /chat/rooms — staff/admin creates room for customer
const getOrCreateRoom = catchAsync(async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.error("customerId required", 400);
  const data = await chatService.getOrCreateRoom(req.user.id, customerId);
  return res.success(data, "Chat room ready");
});

// GET /chat/rooms/:roomId/messages
const getMessages = catchAsync(async (req, res) => {
  const data = await chatService.getMessages(req.params.roomId, req.user.id);
  return res.success(data, "Messages fetched");
});

// POST /chat/rooms/:roomId/messages
const sendMessage = catchAsync(async (req, res) => {
  const isAdmin = req.user.type === "admin";
  const { content, fileUrl, fileType } = req.body;
  const data = await chatService.sendMessage(req.params.roomId, {
    senderType: isAdmin ? "ADMIN" : "CUSTOMER",
    adminId: isAdmin ? req.user.id : null,
    customerId: isAdmin ? null : req.user.id,
    content,
    fileUrl,
    fileType,
  });

  // Emit via socket.io to room named by customerId so both FE and Admin see it live
  const io = req.app.get("io");
  if (io) {
    const roomName = isAdmin ? String(data.customerId) : String(req.user.id);
    const serialized = {
      ...data,
      id: data.id?.toString(),
      chatRoomId: data.chatRoomId?.toString(),
      adminId: data.adminId?.toString(),
      customerId: data.customerId?.toString(),
    };
    io.of("/chat").to(`chat:${roomName}`).emit("chat:message", serialized);

    // When customer sends → notify admin/staff via /notifications namespace
    if (!isAdmin) {
      io.of("/notifications").to("admin_room").emit("chat_notification", {
        type: "CHAT_MESSAGE",
        title: "New customer message",
        message: content?.substring(0, 80) || "Sent a file",
        chatRoomId: data.chatRoomId?.toString(),
        customerId: String(req.user.id),
        createdAt: new Date().toISOString(),
      });
    }
  }

  return res.success(data, "Message sent", 201);
});

// PATCH /chat/rooms/:roomId/read
const markAsRead = catchAsync(async (req, res) => {
  const readerType = req.user.type === "admin" ? "ADMIN" : "CUSTOMER";
  await chatService.markAsRead(req.params.roomId, readerType);
  return res.success(null, "Marked as read");
});

// POST /chat/ai — standalone AI chat (no room)
const aiChat = catchAsync(async (req, res) => {
  const { message, history } = req.body;
  if (!message?.trim()) return res.error("message required", 400);
  const reply = await chatService.aiChat(message, history || []);
  return res.success({ reply }, "AI response");
});

module.exports = { getMyRooms, getOrCreateRoom, getMessages, sendMessage, markAsRead, aiChat };
