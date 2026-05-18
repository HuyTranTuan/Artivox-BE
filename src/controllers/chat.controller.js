const chatService = require("@services/chat.service");
const aiService = require("@services/ai.service");
const catchAsync = require("@utils/catchAsync");

const getMyRooms = catchAsync(async (req, res) => {
  const data = req.user.type === "admin" ? await chatService.getAdminRooms(req.user.id) : await chatService.getCustomerRooms(req.user.id);
  return res.success(data, "Chat rooms fetched");
});

const getOrCreateRoom = catchAsync(async (req, res) => {
  const { customerId } = req.body;
  const data = await chatService.getOrCreateRoom(req.user.id, customerId);
  return res.success(data, "Chat room ready");
});

const getMessages = catchAsync(async (req, res) => {
  const data = await chatService.getMessages(parseInt(req.params.roomId), req.user.id);
  return res.success(data, "Messages fetched");
});

const sendMessage = catchAsync(async (req, res) => {
  const isAdmin = req.user.type === "admin";
  const { content, fileUrl, fileType } = req.body;

  const data = await chatService.sendMessage(parseInt(req.params.roomId), {
    senderType: isAdmin ? "ADMIN" : "CUSTOMER",
    adminId: isAdmin ? req.user.id : null,
    customerId: isAdmin ? null : req.user.id,
    content,
    fileUrl,
    fileType,
  });

  // If customer sends text message (no file), auto-generate AI response
  if (!isAdmin && !fileUrl) {
    try {
      const messages = await chatService.getMessages(parseInt(req.params.roomId), req.user.id);
      const context = aiService.buildConversationContext(messages);
      const aiResponse = await aiService.generateAIResponse(content, context);

      await chatService.sendMessage(parseInt(req.params.roomId), {
        senderType: "ADMIN",
        adminId: 1, // System AI
        customerId: null,
        content: aiResponse,
      });
    } catch (error) {
      console.error("Error generating AI response:", error.message);
    }
  }

  return res.success(data, "Message sent", 201);
});

const markAsRead = catchAsync(async (req, res) => {
  const readerType = req.user.type === "admin" ? "ADMIN" : "CUSTOMER";
  await chatService.markAsRead(parseInt(req.params.roomId), readerType);
  return res.success(null, "Marked as read");
});

module.exports = { getMyRooms, getOrCreateRoom, getMessages, sendMessage, markAsRead };
