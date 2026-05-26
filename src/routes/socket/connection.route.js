function socketNotification(socket) {
  if (socket.user) {
    // Targeted notifications channel for all logged-in users (customer & staff)
    socket.join(`notification-${socket.user.id}`);
    
    if (["ADMIN", "STAFF"].includes(socket.user.role)) {
      socket.join("admin_room");
      console.log(`[Socket] ${socket.user.id} joined admin_room and notification-${socket.user.id}`);
    }
  }

  socket.on("alert", (data) => {
    console.log(data);
  });
}

module.exports = socketNotification;