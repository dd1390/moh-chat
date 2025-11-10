const socket = io();

const login = document.getElementById("login");
const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const enterBtn = document.getElementById("enter");
const sendForm = document.getElementById("sendForm");
const msgInput = document.getElementById("msgInput");
const clearBtn = document.getElementById("clearChat");

let room, name;

// دخول الغرفة
enterBtn.onclick = () => {
  room = document.getElementById("room").value.trim();
  name = document.getElementById("name").value.trim();
  if (!room || !name) return;
  socket.emit("join", { room, name });
  login.style.display = "none";
  chat.style.display = "block";
};

// عرض الهستوري
socket.on("history", (list) => list.forEach(addMessage));

// وصول رسالة جديدة
socket.on("message", addMessage);

// تم مسح المحادثة
socket.on("cleared", () => msgs.innerHTML = "");

// إرسال رسالة
sendForm.onsubmit = (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("message", { room, name, text });
  msgInput.value = "";
};

// مسح المحادثة
clearBtn.onclick = () => socket.emit("clear", room);

// إضافة رسالة للشاشة
function addMessage({ name, text }) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${name}:</b> ${text}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}
