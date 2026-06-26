const Tool = {
  BRUSH: "BRUSH",
  ERASER: "ERASER",
};

let currentTool = Tool.BRUSH;
let brushSize = 1;

const socket = new WebSocket(`ws://${window.location.hostname}:81/`);

function updateBrushSizeUI() {
  size1Btn.classList.toggle("active", brushSize === 1);
  size2Btn.classList.toggle("active", brushSize === 2);
  size3Btn.classList.toggle("active", brushSize === 3);
}

function setBrushSize(size) {
  if (brushSize === size) {
    return;
  }

  brushSize = size;

  updateBrushSizeUI();

  socket.send(`SIZE,${size}`);
}

socket.onopen = () => {
  console.log("WebSocket connected");

  updateToolbar();
  updateBrushSizeUI();

  socket.send(`TOOL,${currentTool}`);
  socket.send(`SIZE,${brushSize}`);
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

function getCurrentColor() {
  if (currentTool === Tool.BRUSH) {
    return "black";
  } else if (currentTool === Tool.ERASER) {
    return "white";
    brushSize = 5;
  }
}

ctx.strokeStyle = getCurrentColor();
ctx.fillStyle = getCurrentColor();
ctx.lineWidth = 4;
ctx.lineCap = "round";
ctx.lineJoin = "round";

const brushBtn = document.getElementById("brushBtn");
const eraserBtn = document.getElementById("eraserBtn");
const size1Btn = document.getElementById("size1Btn");
const size2Btn = document.getElementById("size2Btn");
const size3Btn = document.getElementById("size3Btn");
const clearButton = document.getElementById("clearButton");
updateToolbar();

brushBtn.addEventListener("click", () => {
  setTool(Tool.BRUSH);
});

eraserBtn.addEventListener("click", () => {
  setTool(Tool.ERASER);
});

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  socket.send("CLEAR");
});

size1Btn.addEventListener("click", () => {
  setBrushSize(1);
});

size2Btn.addEventListener("click", () => {
  setBrushSize(2);
});

size3Btn.addEventListener("click", () => {
  setBrushSize(3);
});

let isDrawing = false;

let previousX = null;
let previousY = null;

function updateToolbar() {
  brushBtn.classList.toggle("active", currentTool === Tool.BRUSH);
  eraserBtn.classList.toggle("active", currentTool === Tool.ERASER);

  canvas.classList.toggle("eraser", currentTool === Tool.ERASER);
}

function setTool(tool) {
  if (currentTool === tool) {
    return;
  }

  currentTool = tool;
  updateToolbar();
  socket.send(`TOOL,${tool}`);
}

function drawPoint(x, y) {
  ctx.strokeStyle = getCurrentColor();
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (previousX === null) {
    ctx.beginPath();
    ctx.arc(x, y, ctx.lineWidth / 2, 0, 2 * Math.PI);
    ctx.fillStyle = getCurrentColor();
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
