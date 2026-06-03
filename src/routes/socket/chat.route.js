/**
 * /chat namespace socket handler
 *
 * Personal join on connect: user:<role>:<id>
 *
 * Client → Server events:
 *   room:join  { chatRoomId }  → subscribe to a specific chat room
 *   room:leave { chatRoomId }  → unsubscribe from a chat room
 *   chat:typing { chatRoomId, senderType } → forward typing indicator
 *
 * Server → Client events (emitted from controller too):
 *   new_message    { ...message }  → new persisted message
 *   messages_read  { chatRoomId, readerType } → all messages marked read
 *   new_notification { type, title, message, chatRoomId } → unread badge ping
 *   chat:typing    { senderType }  → typing indicator forwarded
 */
function socketChat(socket) {
  // Join personal room so controller can target this user directly
  if (socket.user) {
    const { id, type } = socket.user;
    const mappedRole = type === "admin" ? "STAFF" : "CUSTOMER";
    socket.join(`user:${mappedRole}:${id}`);
  }

  // Client opens a chat room → subscribe
  socket.on("room:join", ({ chatRoomId }) => {
    if (!chatRoomId) return;
    const room = chatRoomId.startsWith("internal:") ? `room:${chatRoomId}` : `room:chat:${chatRoomId}`;
    socket.join(room);
  });

  // Client closes/leaves a chat room
  socket.on("room:leave", ({ chatRoomId }) => {
    if (!chatRoomId) return;
    const room = chatRoomId.startsWith("internal:") ? `room:${chatRoomId}` : `room:chat:${chatRoomId}`;
    socket.leave(room);
  });

  // Typing indicator — forward to everyone else in the room
  socket.on("chat:typing", ({ chatRoomId, senderType }) => {
    if (!chatRoomId) return;
    const room = chatRoomId.startsWith("internal:") ? `room:${chatRoomId}` : `room:chat:${chatRoomId}`;
    socket
      .to(room)
      .emit("chat:typing", { senderType });
  });

  socket.on("disconnect", () => { });
}

module.exports = socketChat;