const socket = io();

const login = document.getElementById("login");
const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");
const enterBtn = document.getElementById("enter");
const sendForm = document.getElementById("sendForm");
const msgInput = document.getElementById("msgInput");
const clearBtn = document.getElementById("clearChat");
const voiceBtn = document.getElementById("voiceBtn");
const voiceStatus = document.getElementById("voiceStatus");

let room, name;
let localStream, peerConnection;

// دخول الغرفة
enterBtn.onclick = () => {
  room = document.getElementById("room").value.trim();
  name = document.getElementById("name").value.trim();
  if (!room || !name) return;
  socket.emit("join", { room, name });
  login.style.display = "none";
  chat.style.display = "block";
};

// history
socket.on("history", (list) => list.forEach(addMessage));

// الرسائل
socket.on("message", addMessage);

// مسح المحادثة
socket.on("cleared", () => msgs.innerHTML = "");

sendForm.onsubmit = (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("message", { room, name, text });
  msgInput.value = "";
};

clearBtn.onclick = () => socket.emit("clear", room);

function addMessage({ name, text }) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${name}:</b> ${text}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// Voice Chat
voiceBtn.onclick = async () => {
  voiceStatus.innerText = "🎙️ جاري تفعيل الصوت...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  peerConnection = new RTCPeerConnection();
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("voice-offer", { room, offer });

  voiceStatus.innerText = "🎤 الصوت شغال";
};

socket.on("voice-offer", async ({ offer }) => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  peerConnection = new RTCPeerConnection();
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("voice-answer", { room, answer });
});

socket.on("voice-answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});
