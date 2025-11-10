const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let chatHistory = [];

io.on("connection", (socket) => {

  socket.on("join", ({ room, name }) => {
    socket.join(room);
    socket.data = { room, name };
    socket.emit("history", chatHistory);
    io.to(room).emit("message", { name: "⚙️ النظام", text: `${name} دخل الغرفة` });
  });

  socket.on("message", ({ room, name, text }) => {
    const msg = { name, text };
    chatHistory.push(msg);
    io.to(room).emit("message", msg);
  });

  socket.on("clear", (room) => {
    chatHistory = [];
    io.to(room).emit("cleared");
  });

  // صوت (WebRTC Signaling)
  socket.on("voice-offer", ({ room, offer }) => {
    socket.to(room).emit("voice-offer", { offer });
  });

  socket.on("voice-answer", ({ room, answer }) => {
    socket.to(room).emit("voice-answer", { answer });
  });

  // من يتكلم
  socket.on("talking", ({ room, name, talking }) => {
    io.to(room).emit("talking", { name, talking });
  });

  // يكتب الآن
  socket.on("typing", ({ room, name }) => {
    socket.to(room).emit("typing", { name });
  });

});

server.listen(3000, () => console.log("✅ Server running → http://localhost:3000"));
