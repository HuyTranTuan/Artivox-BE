const jwt = require("jsonwebtoken");
const { jwtSecret } = require("@config/auth");

const socketAuthMiddleware = (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, jwtSecret);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

module.exports = { socketAuthMiddleware };
