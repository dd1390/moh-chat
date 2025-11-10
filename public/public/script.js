const socket = io();

const login = document.getElementById("login");
const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

let room, name;

document.getElementById("go").onclick = () => {
  room = document.getElementById("room").value.trim();
  name = document.getElementById("name").value.trim();
  if (!room || !name) return;
  socket.emit("join", { room, name });
  login.style.display = "none";
  chat.style.display = "block";
};

socket.on("message", (m) => {
  const div = document.createElement("div");
  div.innerHTML = `<b>${m.name}:</b> ${m.text}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
});

document.getElementById("send").onsubmit = (e) => {
  e.preventDefault();
  const text = document.getElementById("txt").value.trim();
  if (!text) return;
  socket.emit("message", { room, text });
  document.getElementById("txt").value = "";
};
