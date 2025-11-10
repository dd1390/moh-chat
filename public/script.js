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
const pttButton = document.getElementById("pttButton");
const voiceLevel = document.getElementById("voiceLevel");
const typing = document.getElementById("typing");

let room, name;
let localStream, peerConnection, micTrack;
let audioContext, analyser, dataArray, typingTimeout;

// دخول الغرفة
enterBtn.onclick = () => {
  room = document.getElementById("room").value.trim();
  name = document.getElementById("name").value.trim();
  if (!room || !name) return;
  socket.emit("join", { room, name });
  login.style.display = "none";
  chat.style.display = "block";
};

// رسائل
socket.on("history", (list) => list.forEach(addMessage));
socket.on("message", addMessage);
socket.on("cleared", () => msgs.innerHTML = "");

// إرسال رسالة
sendForm.onsubmit = (e) => {
  e.preventDefault();
  if (!msgInput.value.trim()) return;
  socket.emit("message", { room, name, text: msgInput.value });
  msgInput.value = "";
};

// مسح محادثة
clearBtn.onclick = () => socket.emit("clear", room);

// عرض الرسائل
function addMessage({ name, text }) {
  const div = document.createElement("div");
  div.innerHTML = `<b>${name}:</b> ${text}`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ===== تفعيل الصوت =====
voiceBtn.onclick = async () => {
  voiceStatus.innerText = "🎙️ جاري تفعيل الصوت...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micTrack = localStream.getAudioTracks()[0];

  // مؤشر الصوت
  audioContext = new AudioContext();
  let source = audioContext.createMediaStreamSource(localStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  updateVoiceLevel();

  startVoiceConnection();
  voiceStatus.innerText = "🎤 الصوت جاهز";
};

// اتصال الصوت WebRTC + سيرفر TURN
async function startVoiceConnection() {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });

  peerConnection.addTrack(micTrack, localStream);

  peerConnection.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("voice-offer", { room, offer });
}

socket.on("voice-offer", async ({ offer }) => {
  peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
      }
    ]
  });

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micTrack = localStream.getAudioTracks()[0];
  peerConnection.addTrack(micTrack, localStream);

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

// ===== Push To Talk =====
pttButton.onmousedown = () => micTrack.enabled = true, socket.emit("talking", { room, name, talking:true });
pttButton.onmouseup   = () => micTrack.enabled = false, socket.emit("talking", { room, name, talking:false });

document.addEventListener("keydown", (e) => {
  if (e.code === "CapsLock") micTrack.enabled = true, socket.emit("talking", { room, name, talking:true });
});
document.addEventListener("keyup", (e) => {
  if (e.code === "CapsLock") micTrack.enabled = false, socket.emit("talking", { room, name, talking:false });
});

// ===== من يتكلم =====
socket.on("talking", ({ name, talking }) => highlightSpeaker(name, talking));

function highlightSpeaker(name, talking) {
  [...document.querySelectorAll("#msgs b")].forEach(el => {
    if (el.textContent.replace(":", "") === name) {
      el.style.color = talking ? "#4ade80" : "#fff";
    }
  });
}

// ===== يكتب الآن =====
msgInput.oninput = () => socket.emit("typing", { room, name });

socket.on("typing", ({ name }) => {
  typing.innerText = `${name} يكتب... ✍️`;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => typing.innerText = "", 1000);
});

// ===== مؤشر الصوت =====
function updateVoiceLevel() {
  requestAnimationFrame(updateVoiceLevel);
  analyser.getByteFrequencyData(dataArray);
  let level = Math.max(...dataArray) / 255;
  voiceLevel.style.width = (level * 100) + "%";
}
