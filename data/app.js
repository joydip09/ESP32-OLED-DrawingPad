async function sendCmd(cmd) {
  const start = performance.now();

  const response = await fetch("/" + cmd);

  const oledTime = await response.text();

  const end = performance.now();

  console.log(
    `${cmd} Total: ${(end - start).toFixed(1)} ms OLED: ${oledTime} ms`,
  );
}

const canvas = document.getElementById("drawingCanvas");

const ctx = canvas.getContext("2d");

let isDrawing = false;

function drawPoint(x, y) {
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, 4, 4);

  fetch(`/pixel?x=${x}&y=${y}`).catch((error) => console.error(error));
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
