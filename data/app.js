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

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);

  console.log(`Canvas clicked at (${x}, ${y})`);
});
