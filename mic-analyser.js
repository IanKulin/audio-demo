const button = document.getElementById("start");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let audioCtx, analyser, dataArray;

button.onclick = async () => {
  audioCtx = new AudioContext();

  // Ask for microphone access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Create mic source
  const source = audioCtx.createMediaStreamSource(stream);

  // Analyser
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Wire graph
  source.connect(analyser);
  // ⚠️ Do NOT connect analyser to destination (prevents feedback)

  draw();
};

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / dataArray.length;

  dataArray.forEach((value, i) => {
    const barHeight = value;
    ctx.fillRect(
      i * barWidth,
      canvas.height - barHeight,
      barWidth,
      barHeight
    );
  });
}
