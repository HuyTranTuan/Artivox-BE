const express = require("express");
const chatController = require("@controllers/chat.controller");
const { authMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/rooms", chatController.getMyRooms);
router.post("/rooms", chatController.getOrCreateRoom);
router.get("/rooms/:roomId/messages", chatController.getMessages);
router.post("/rooms/:roomId/messages", chatController.sendMessage);
router.patch("/rooms/:roomId/read", chatController.markAsRead);
router.post("/ai", chatController.aiChat);          // standalone AI (no room)

module.exports = router;
