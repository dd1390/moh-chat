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

let room, name;
let localStream, peerConnection;
let micTrack;
let audioContext, analyser, dataArray;

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


// ===== Voice =====
voiceBtn.onclick = async () => {
  voiceStatus.innerText = "🎙️ جاري تفعيل الصوت...";
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micTrack = localStream.getAudioTracks()[0];

  audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(localStream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  updateVoiceLevel();

  startVoiceConnection();
  voiceStatus.innerText = "🎤 الصوت جاهز";
};

async function startVoiceConnection() {
  peerConnection = new RTCPeerConnection();
  peerConnection.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  peerConnection.addTrack(micTrack, localStream);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("voice-offer", { room, offer });
}

socket.on("voice-offer", async ({ offer }) => {
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  micTrack = localStream.getAudioTracks()[0];

  peerConnection = new RTCPeerConnection();
  peerConnection.ontrack = (event) => {
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    document.body.appendChild(audio);
  };
  peerConnection.addTrack(micTrack, localStream);

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("voice-answer", { room, answer });
});

socket.on("voice-answer", async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});


// ===== Push-To-Talk =====
pttButton.onmousedown = () => micTrack.enabled = true;
pttButton.onmouseup   = () => micTrack.enabled = false;
pttButton.ontouchstart = () => micTrack.enabled = true;
pttButton.ontouchend   = () => micTrack.enabled = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "CapsLock") micTrack.enabled = true;
});
document.addEventListener("keyup", (e) => {
  if (e.code === "CapsLock") micTrack.enabled = false;
});

function updateVoiceLevel() {
  requestAnimationFrame(updateVoiceLevel);
  analyser.getByteFrequencyData(dataArray);
  let level = Math.max(...dataArray) / 255;
  voiceLevel.style.width = (level * 100) + "%";
}
