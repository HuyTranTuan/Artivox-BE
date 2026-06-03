/**
 * /notifications namespace connection handler
 *
 * Personal rooms joined on connect:
 *   user:ADMIN:<id>   (or user:STAFF:<id>)
 *   user:CUSTOMER:<id>
 *   admin_room  — shared room for all ADMIN/STAFF (unassigned chat broadcasts)
 */
function socketNotification(socket) {
  if (socket.user) {
    const { id, type } = socket.user;
    const mappedRole = type === "admin" ? "STAFF" : "CUSTOMER";
    const personalRoom = `user:${mappedRole}:${id}`;
    socket.join(personalRoom);

    if (mappedRole === "STAFF") {
      socket.join("admin_room");
    }
  }

  socket.on("alert", (data) => {});

  socket.on("disconnect", () => {});
}

module.exports = socketNotification;