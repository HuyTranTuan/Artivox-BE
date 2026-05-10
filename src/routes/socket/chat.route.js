async function socketChat(socket) {
  socket.on("message", (data) => {
    console.log(`${socket.id} - ${data}`)
  });
}

module.exports = socketChat;