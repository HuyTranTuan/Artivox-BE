function socketNotification(socket) {
  if (socket.user && ["ADMIN", "STAFF"].includes(socket.user.role)) {
    socket.join("admin_room");
    console.log(`[Socket] ${socket.user.id} joined admin_room`);
  }

  socket.on("alert", (data) => {
    console.log(data);
  });
}

module.exports = socketNotification;