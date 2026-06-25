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

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);

  console.log(`Canvas clicked at (${x}, ${y})`);

  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, 4, 4);

  fetch(`/pixel?x=${x}&y=${y}`)
    .then((response) => response.text())
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
});
