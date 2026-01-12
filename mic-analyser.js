const button = document.getElementById("start");
const statusDiv = document.getElementById("status");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("threshold-value");
const currentLevelSpan = document.getElementById("current-level");

let audioCtx, analyser, dataArray;
let threshold = 50;

// Update threshold display when slider changes
thresholdSlider.oninput = () => {
  threshold = parseInt(thresholdSlider.value);
  thresholdValue.textContent = threshold;
};

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

  button.disabled = true;
  button.textContent = "Mic active";
  
  draw();
};

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  // Calculate which bins correspond to 400-800Hz
  const sampleRate = audioCtx.sampleRate;
  const fftSize = analyser.fftSize;
  
  const minFreq = 400;
  const maxFreq = 800;
  
  const minBin = Math.floor((minFreq * fftSize) / sampleRate);
  const maxBin = Math.ceil((maxFreq * fftSize) / sampleRate);
  
  // Calculate average amplitude in the frequency range
  let sum = 0;
  let count = 0;
  for (let i = minBin; i < maxBin; i++) {
    sum += dataArray[i];
    count++;
  }
  const avgAmplitude = count > 0 ? sum / count : 0;
  
  // Display current level
  currentLevelSpan.textContent = avgAmplitude.toFixed(1);
  
  // Check if amplitude exceeds threshold
  if (avgAmplitude > threshold) {
    statusDiv.textContent = "Tone";
    statusDiv.style.backgroundColor = "#90EE90";
    statusDiv.style.color = "#006400";
  } else {
    statusDiv.textContent = "No tone";
    statusDiv.style.backgroundColor = "#FFB6C1";
    statusDiv.style.color = "#8B0000";
  }
}
