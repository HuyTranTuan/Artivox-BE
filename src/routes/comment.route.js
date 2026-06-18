const express = require("express");
const commentController = require("@controllers/comment.controller");
const { authMiddleware, optionalAuthMiddleware } = require("@middlewares/auth.middleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, commentController.getComments);
router.post("/", authMiddleware, commentController.createComment);
router.delete("/:id", authMiddleware, commentController.deleteComment);

module.exports = router;
