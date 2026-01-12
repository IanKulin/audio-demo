const button = document.getElementById("start");
const statusDiv = document.getElementById("status");
const thresholdSlider = document.getElementById("threshold");
const thresholdValue = document.getElementById("threshold-value");
const minFreqSlider = document.getElementById("minFreq");
const minFreqValue = document.getElementById("minFreq-value");
const maxFreqSlider = document.getElementById("maxFreq");
const maxFreqValue = document.getElementById("maxFreq-value");
const charSpaceLengthSlider = document.getElementById("charSpaceLength");
const charSpaceLengthValue = document.getElementById("charSpaceLength-value");
const meterBar = document.getElementById("meter-bar");
const thresholdLine = document.getElementById("threshold-line");
const currentLevelSpan = document.getElementById("current-level");
const thresholdDisplaySpan = document.getElementById("threshold-display");
const accordionHeader = document.getElementById("accordion-header");
const accordionIcon = document.getElementById("accordion-icon");
const controls = document.getElementById("controls");

let audioCtx, analyser, dataArray;
let currentState = undefined; // undefined, "tone", or "no-tone"
let currentStateStartTime = null;
let stateHistory = []; // Array to store last 10 state periods
const MAX_HISTORY = 10;

// Accordion functionality
function toggleAccordion() {
  const isOpen = controls.classList.toggle('open');
  accordionIcon.classList.toggle('open');
  localStorage.setItem('accordionOpen', isOpen);
}

// Load accordion state from localStorage
const accordionOpen = localStorage.getItem('accordionOpen') === 'true';
if (accordionOpen) {
  controls.classList.add('open');
  accordionIcon.classList.add('open');
}

accordionHeader.addEventListener('click', toggleAccordion);

// Load settings from localStorage or use defaults
let threshold = localStorage.getItem('micThreshold') ? parseInt(localStorage.getItem('micThreshold')) : 50;
let minFreq = localStorage.getItem('micMinFreq') ? parseInt(localStorage.getItem('micMinFreq')) : 400;
let maxFreq = localStorage.getItem('micMaxFreq') ? parseInt(localStorage.getItem('micMaxFreq')) : 800;
let charSpaceLength = localStorage.getItem('micCharSpaceLength') ? parseInt(localStorage.getItem('micCharSpaceLength')) : 0;

// Set initial slider values
thresholdSlider.value = threshold;
thresholdValue.textContent = threshold;
thresholdDisplaySpan.textContent = threshold;

minFreqSlider.value = minFreq;
minFreqValue.textContent = minFreq;

maxFreqSlider.value = maxFreq;
maxFreqValue.textContent = maxFreq;

charSpaceLengthSlider.value = charSpaceLength;
charSpaceLengthValue.textContent = charSpaceLength;

// Update threshold line position
function updateThresholdLine() {
  const percentage = (threshold / 255) * 100;
  thresholdLine.style.left = percentage + '%';
}
updateThresholdLine();

// Update threshold display when slider changes
thresholdSlider.oninput = () => {
  threshold = parseInt(thresholdSlider.value);
  thresholdValue.textContent = threshold;
  thresholdDisplaySpan.textContent = threshold;
  updateThresholdLine();
  localStorage.setItem('micThreshold', threshold);
};

// Update minFreq when slider changes
minFreqSlider.oninput = () => {
  minFreq = parseInt(minFreqSlider.value);
  minFreqValue.textContent = minFreq;
  localStorage.setItem('micMinFreq', minFreq);
  
  // Ensure minFreq doesn't exceed maxFreq
  if (minFreq >= maxFreq) {
    maxFreq = minFreq + 50;
    maxFreqSlider.value = maxFreq;
    maxFreqValue.textContent = maxFreq;
    localStorage.setItem('micMaxFreq', maxFreq);
  }
};

// Update maxFreq when slider changes
maxFreqSlider.oninput = () => {
  maxFreq = parseInt(maxFreqSlider.value);
  maxFreqValue.textContent = maxFreq;
  localStorage.setItem('micMaxFreq', maxFreq);
  
  // Ensure maxFreq doesn't go below minFreq
  if (maxFreq <= minFreq) {
    minFreq = maxFreq - 50;
    if (minFreq < 50) minFreq = 50;
    minFreqSlider.value = minFreq;
    minFreqValue.textContent = minFreq;
    localStorage.setItem('micMinFreq', minFreq);
  }
};

// Update charSpaceLength when slider changes
charSpaceLengthSlider.oninput = () => {
  charSpaceLength = parseInt(charSpaceLengthSlider.value);
  charSpaceLengthValue.textContent = charSpaceLength;
  localStorage.setItem('micCharSpaceLength', charSpaceLength);
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

function updateHistoryDisplay() {
  const historyList = document.getElementById('history-list');
  if (!historyList) return;
  
  // Clear current display
  historyList.innerHTML = '';
  
  // Display history in reverse order (newest first)
  for (let i = stateHistory.length - 1; i >= 0; i--) {
    const entry = stateHistory[i];
    const duration = (entry.endTime - entry.startTime).toFixed(0);
    
    const li = document.createElement('li');
    li.textContent = `${entry.state}: ${duration} ms`;
    li.className = entry.state;
    historyList.appendChild(li);
  }
}

function draw() {
  requestAnimationFrame(draw);

  analyser.getByteFrequencyData(dataArray);

  // Calculate which bins correspond to the frequency range
  const sampleRate = audioCtx.sampleRate;
  const fftSize = analyser.fftSize;
  
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
  
  // Update level meter
  const percentage = (avgAmplitude / 255) * 100;
  meterBar.style.width = percentage + '%';
  currentLevelSpan.textContent = Math.round(avgAmplitude);
  
  // Check if amplitude exceeds threshold
  const newState = avgAmplitude > threshold ? "tone" : "no-tone";
  
  // Detect state change
  if (newState !== currentState) {
    const now = Date.now();
    
    // If we had a previous state, record it in history
    if (currentState !== undefined && currentStateStartTime !== null) {
      const historyEntry = {
        state: currentState,
        startTime: currentStateStartTime,
        endTime: now
      };
      
      // Add to history
      stateHistory.push(historyEntry);
      
      // Keep only last 10 entries (FIFO)
      if (stateHistory.length > MAX_HISTORY) {
        stateHistory.shift();
      }
      
      // Update display
      updateHistoryDisplay();
    }
    
    // Update current state
    currentState = newState;
    currentStateStartTime = now;
  }
  
  // Update status display
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
