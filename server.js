const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let chatHistory = []; // نخزن آخر الرسائل

io.on("connection", (socket) => {
  // أرسل الهستوري للداخل
  socket.emit("history", chatHistory);

  // دخول غرفة
  socket.on("join", ({ room, name }) => {
    socket.join(room);
    socket.data = { room, name };
    io.to(room).emit("message", { name: "⚙️ النظام", text: `${name} دخل الغرفة` });
  });

  // إرسال رسالة
  socket.on("message", ({ room, name, text }) => {
    const msg = { name, text };
    chatHistory.push(msg);
    io.to(room).emit("message", msg);
  });

  // مسح المحادثة
  socket.on("clear", (room) => {
    chatHistory = [];
    io.to(room).emit("cleared");
  });
});

server.listen(3000, () => {
  console.log("✅ Server running → http://localhost:3000");
});
