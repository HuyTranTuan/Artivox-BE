/**
 * Socket.io chat handler
 * Room naming: "chat:{customerId}" — same room joined by both customer and staff.
 *
 * Events (client → server):
 *   chat:join   { customerId }  → join the room
 *   chat:typing { customerId }  → forward typing indicator
 *   chat:read   { customerId, roomId } → mark messages read
 *
 * Events (server → client):
 *   chat:message  { ...message }  → new message (also emitted by REST controller)
 *   chat:typing   { senderType }  → typing indicator
 */
function socketChat(socket) {
  // Client joins its room by customerId
  socket.on("chat:join", ({ customerId }) => {
    if (!customerId) return;
    const room = `chat:${customerId}`;
    socket.join(room);
    console.log(`[Socket] ${socket.id} joined ${room}`);
  });

  // Client leaves room
  socket.on("chat:leave", ({ customerId }) => {
    if (!customerId) return;
    const room = `chat:${customerId}`;
    socket.leave(room);
    console.log(`[Socket] ${socket.id} left ${room}`);
  });

  // Typing indicator — forward to all others in the room
  socket.on("chat:typing", ({ customerId, senderType }) => {
    if (!customerId) return;
    socket.to(`chat:${customerId}`).emit("chat:typing", { senderType });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] ${socket.id} disconnected`);
  });
}

module.exports = socketChat;