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
router.post("/rooms/:roomId/claim", chatController.claimRoom);
router.get("/rooms/:roomId/messages", chatController.getMessages);
router.post("/rooms/:roomId/messages", chatController.sendMessage);
router.patch("/rooms/:roomId/read", chatController.markAsRead);

// Internal Chat Routes (Admin/Staff to Admin/Staff)
router.get("/internal-users", chatController.getInternalUsers);
router.get("/internal-rooms", chatController.getInternalRooms);
router.post("/internal-rooms", chatController.getOrCreateInternalRoom);
router.get("/internal-rooms/:roomId/messages", chatController.getInternalMessages);
router.post("/internal-rooms/:roomId/messages", chatController.sendInternalMessage);
router.patch("/internal-rooms/:roomId/read", chatController.markInternalAsRead);

module.exports = router;
