const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const port = process.env.PORT | 8000;

const app = express();
const httpServer = createServer(app);

const url =
  process.env.NODE_ENV === "development"
    ? process.env.DEV_URL
    : process.env.PROD_URL;

const io = new Server(httpServer, {
  cors: {
    origin: url,
  },
});

io.on("connection", (socket) => {
  console.log(`Connection successful ${socket.handshake.auth.email}`);

  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    const { email, name } = socket;
    if (email && name)
      users.push({
        //   userId: socket.id,
        email: socket.email,
        name: socket.name,
      });
  }
  socket.emit("users", users);

  socket.broadcast.emit("user connected", {
    name: socket.name,
    email: socket.email,
  });

  socket.on("message", (body) => {
    io.emit("update thread", {
      sender: body.sender.name,
      content: body.content,
    });
  });
});

io.use((socket, next) => {
  socket.email = socket.handshake.auth.email;
  socket.name = socket.handshake.auth.name;
  next();
});

httpServer.listen(port, () => {
  console.log(`Server running on port 8000`);
});
