const button = document.getElementById("start");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let audioCtx, analyser, dataArray;

button.onclick = async () => {
  audioCtx = new AudioContext();

  // Source: simple oscillator
  const osc = audioCtx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 220;

  // Analyser
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Wire graph
  osc.connect(analyser);
  analyser.connect(audioCtx.destination);

  osc.start();

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
