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

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log(`Canvas clicked at (${Math.floor(x)}, ${Math.floor(y)})`);
});
