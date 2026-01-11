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

  draw();
};

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate which bins correspond to 400-800Hz
  const sampleRate = audioCtx.sampleRate;
  const fftSize = analyser.fftSize;
  
  const minFreq = 400;
  const maxFreq = 800;
  
  const minBin = Math.floor((minFreq * fftSize) / sampleRate);
  const maxBin = Math.ceil((maxFreq * fftSize) / sampleRate);
  
  // Only draw the bins in our frequency range
  const binCount = maxBin - minBin;
  const barWidth = canvas.width / binCount;

  for (let i = 0; i < binCount; i++) {
    const value = dataArray[minBin + i];
    const barHeight = value;
    ctx.fillRect(
      i * barWidth,
      canvas.height - barHeight,
      barWidth,
      barHeight
    );
  }
}
