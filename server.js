const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let chatHistory = [];

io.on("connection", (socket) => {

  // إرسال الهستوري عند الدخول
  socket.on("join", ({ room, name }) => {
    socket.join(room);
    socket.data = { room, name };
    socket.emit("history", chatHistory);
    io.to(room).emit("message", { name: "⚙️ النظام", text: `${name} دخل الغرفة` });
  });

  // الرسائل النصية
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

  // Voice WebRTC
  socket.on("voice-offer", ({ room, offer }) => {
    socket.to(room).emit("voice-offer", { offer });
  });

  socket.on("voice-answer", ({ room, answer }) => {
    socket.to(room).emit("voice-answer", { answer });
  });

});

server.listen(3000, () => console.log("✅ Server running → http://localhost:3000"));
