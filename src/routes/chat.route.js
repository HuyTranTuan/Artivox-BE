const express = require("express");
const chatController = require("@controllers/chat.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

// AI chat — public (no auth needed, works for guests + logged-in users)
router.post("/ai", chatController.aiChat);

// All other chat routes require auth
router.use(authMiddleware);
router.get("/rooms", chatController.getMyRooms);
router.post("/rooms", chatController.getOrCreateRoom);
router.get("/rooms/:roomId/messages", chatController.getMessages);
router.post("/rooms/:roomId/messages", chatController.sendMessage);
router.patch("/rooms/:roomId/read", chatController.markAsRead);

module.exports = router;
