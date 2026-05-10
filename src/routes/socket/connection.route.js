function socketNotification(socket) {
  socket.on("alert", (data) => {
    console.log(data);
  });
}

module.exports = socketNotification;