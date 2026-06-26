const socket = new WebSocket(`ws://${window.location.hostname}:81/`);

socket.onopen = () => {
  console.log("WebSocket connected");
  socket.send("hello");
};

socket.onclose = () => {
  console.log("WebSocket disconnected");
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

socket.onmessage = (event) => {
  console.log("Received:", event.data);
};

const canvas = document.getElementById("drawingCanvas");

const ctx = canvas.getContext("2d");

const clearButton = document.getElementById("clearButton");

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  fetch("/clear").catch((error) => console.error(error));
});

let isDrawing = false;

function drawPoint(x, y) {
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, 4, 4);

  fetch(`/pixel?x=${x}&y=${y}`).catch((error) => console.error(error));
  socket.send(`${x},${y}`);
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);

  drawPoint(x, y);
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);

  console.log(`Drawing at (${x}, ${y})`);

  drawPoint(x, y);
});
