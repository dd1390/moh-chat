const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join", ({ room, name }) => {
    socket.join(room);
    socket.data.name = name;
    io.to(room).emit("message", { name: "⚙️ النظام", text: `${name} دخل الغرفة.` });
  });

  socket.on("message", ({ room, text }) => {
    io.to(room).emit("message", { name: socket.data.name, text });
  });
});

server.listen(3000, () => console.log("✅ Server ready on port 3000"));

