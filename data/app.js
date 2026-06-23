async function sendCmd(cmd) {
  const start = performance.now();

  const response = await fetch("/" + cmd);

  const oledTime = await response.text();

  const end = performance.now();

  console.log(
    `${cmd} Total: ${(end - start).toFixed(1)} ms OLED: ${oledTime} ms`,
  );
}
