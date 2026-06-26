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

ctx.strokeStyle = "black";
ctx.fillStyle = "black";
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.lineJoin = "round";

const Tool = {
  BRUSH: "BRUSH",
  ERASER: "ERASER",
};

let currentTool = Tool.BRUSH;

const clearButton = document.getElementById("clearButton");

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  socket.send("CLEAR");
});

let isDrawing = false;

let previousX = null;
let previousY = null;

function drawPoint(x, y) {
  ctx.strokeStyle = "black";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  if (previousX === null) {
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = "black";
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(previousX, previousY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  previousX = x;
  previousY = y;

  socket.send(`DRAW,${x},${y}`);
}

function getCanvasCoordinates(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: Math.floor((clientX - rect.left) * scaleX),
    y: Math.floor((clientY - rect.top) * scaleY),
  };
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;

  previousX = null;
  previousY = null;

  socket.send("START");

  const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);

  drawPoint(x, y);
});

window.addEventListener("mouseup", () => {
  if (!isDrawing) return;

  socket.send("END");

  isDrawing = false;

  previousX = null;
  previousY = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;

  const { x, y } = getCanvasCoordinates(event.clientX, event.clientY);

  drawPoint(x, y);
});

canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();

  isDrawing = true;

  previousX = null;
  previousY = null;

  socket.send("START");

  const touch = event.touches[0];

  const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);

  drawPoint(x, y);
});

canvas.addEventListener("touchmove", (event) => {
  if (!isDrawing) return;

  event.preventDefault();

  const touch = event.touches[0];

  const { x, y } = getCanvasCoordinates(touch.clientX, touch.clientY);

  drawPoint(x, y);
});

canvas.addEventListener("touchend", () => {
  if (!isDrawing) return;

  socket.send("END");

  isDrawing = false;

  previousX = null;
  previousY = null;
});
