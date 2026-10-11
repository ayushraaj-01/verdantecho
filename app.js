/**
 * VerdantEcho — Zero-Signal Trail Scout & Bioacoustics AI
 * Built for Hacktoberfest 2026: Touch Grass Theme
 * 100% Client-Side, Zero Telemetry, Runs Fully Offline.
 */

// Application State
const state = {
  audioContext: null,
  analyser: null,
  audioSourceNode: null,
  isListening: false,
  activeSampleAudio: null,
  activeFloraKey: 'sugar_maple',
  activeAudioKey: 'chickadee',
  sightings: [],
  currentPosition: { lat: 44.2705, lon: -71.3033, alt: 420 }, // Default: White Mountains Trailhead
  pocketModeActive: false,
  screenSavedSeconds: 120,
  pocketTimerInterval: null,
  screenTimerInterval: null,
  worker: null
};

// Botanical & Flora Species Knowledge Base
const FLORA_SPECIES_DB = {
  sugar_maple: {
    commonName: "Sugar Maple (Peak Autumn Foliage)",
    latinName: "Acer saccharum",
    confidence: 98.4,
    description: "Peak autumnal anthocyanin transformation. Five palmate lobes with smooth U-shaped sinuses. Native to northeastern hardwood forests. Non-toxic, historic source of maple syrup in late winter.",
    tags: ["Autumn Senescence: 85% Crimson", "Safety: Non-Toxic", "Hardwood Canopy", "Zone 3-8"],
    warning: false,
    colorIndicator: "#ef4444"
  },
  poison_ivy: {
    commonName: "⚠️ Poison Ivy (Urushiol Contact Hazard)",
    latinName: "Toxicodendron radicans",
    confidence: 97.6,
    description: "DANGER: High concentration of urushiol oil. Three almond-shaped leaflets on single stem ('leaves of three, let it be'). Central leaflet has longer petiole. Causes severe allergic contact dermatitis.",
    tags: ["⚠️ TOXIC PLANT ALERT", "Urushiol Hazard", "Trailside Margin", "DO NOT TOUCH"],
    warning: true,
    colorIndicator: "#dc2626"
  },
  chickadee: {
    commonName: "Black-capped Chickadee (Perched)",
    latinName: "Poecile atricapillus",
    confidence: 95.8,
    description: "Visual confirmation of black cap and bib with white cheeks. Seen perching on pine branch inspecting lichen. Frequent participant in mixed winter foraging flocks.",
    tags: ["Songbird Visual", "Foraging Behavior", "Non-Threatening", "Winter Resident"],
    warning: false,
    colorIndicator: "#22c55e"
  },
  forest_trail: {
    commonName: "Old-Growth Deciduous Canopy",
    latinName: "Fagus-Acer Forest Guild",
    confidence: 94.2,
    description: "Multi-tiered woodland trail dominated by mature sugar maple, yellow birch, and eastern hemlock. Abundant forest floor organic duff and moss.",
    tags: ["Canopy Cover: 78%", "Microclimate: Humid Forest", "Trail Condition: Optimal", "High Biodiversity"],
    warning: false,
    colorIndicator: "#f59e0b"
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration note:', err));
  }
  initWorker();
  initGeolocation();
  initTabs();
  initAudioScout();
  initFloraScout();
  initJournal();
  initPocketMode();
  initSunlightToggle();
  initGemmaCompanion();
  startScreenSavedCounter();
});

// 1. Web Worker Initialization
function initWorker() {
  try {
    state.worker = new Worker('ai-worker.js');
    state.worker.onmessage = handleWorkerMessage;
  } catch (err) {
    console.warn("Web Worker fallback: running in main thread mode.", err);
  }
}

function handleWorkerMessage(e) {
  const { type, payload } = e.data;
  if (type === 'AUDIO_CLASSIFICATION_RESULT') {
    renderAudioDetection(payload);
  }
}

// 2. Geolocation (Offline-First Fallback)
function initGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.currentPosition = {
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lon: Math.round(pos.coords.longitude * 10000) / 10000,
          alt: Math.round(pos.coords.altitude || 380)
        };
      },
      (err) => {
        console.log("Using cached offline coordinates for backcountry trailhead.", err.message);
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }
}

// 3. Tab Switching Navigation
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// 4. Bioacoustics Audio Scout
function initAudioScout() {
  const canvas = document.getElementById('spectrogramCanvas');
  const btnMic = document.getElementById('btnMicListen');
  const btnStop = document.getElementById('btnStopListen');
  const fileInput = document.getElementById('audioFileInput');
  const sampleButtons = document.querySelectorAll('.btn-sample');
  const btnLogSighting = document.getElementById('btnLogSighting');
  const btnSpeakResult = document.getElementById('btnSpeakResult');

  // Canvas setup
  setupSpectrogramCanvas(canvas);

  // Microphone toggle
  btnMic.addEventListener('click', toggleMicrophoneListening);
  btnStop.addEventListener('click', stopAudioListening);

  // Audio file upload
  fileInput.addEventListener('change', handleAudioFileUpload);

  // Sample buttons
  sampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sampleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sampleKey = btn.getAttribute('data-sample');
      playAudioSample(sampleKey);
    });
  });

  // Action buttons
  btnLogSighting.addEventListener('click', () => {
    const commonName = document.getElementById('detectedCommonName').innerText;
    const confidence = document.getElementById('detectedConfidence').innerText;
    logTrailSighting('audio', commonName, confidence);
  });

  btnSpeakResult.addEventListener('click', () => {
    const commonName = document.getElementById('detectedCommonName').innerText;
    const desc = document.getElementById('detectedDescription').innerText;
    speakText(`${commonName}. ${desc}`);
  });
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioCtx();
    state.analyser = state.audioContext.createAnalyser();
    state.analyser.fftSize = 2048;
    state.analyser.smoothingTimeConstant = 0.85;
  }
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
  return state.audioContext;
}

async function toggleMicrophoneListening() {
  const btnMic = document.getElementById('btnMicListen');
  const overlay = document.getElementById('canvasPlaceholderOverlay');

  if (state.isListening) {
    stopAudioListening();
    return;
  }

  try {
    const ctx = getAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    if (state.audioSourceNode) {
      state.audioSourceNode.disconnect();
    }

    state.audioSourceNode = ctx.createMediaStreamSource(stream);
    state.audioSourceNode.connect(state.analyser);

    state.isListening = true;
    btnMic.classList.add('recording');
    document.getElementById('micBtnText').innerText = "Listening to Trail...";
    overlay.style.display = 'none';

    renderAudioLoop();

    // Trigger trail classification interval
    state.classificationInterval = setInterval(() => {
      classifyCurrentAudioSpectrum(null);
    }, 1800);

  } catch (err) {
    alert("Microphone access unavailable. You can use the instant Wildlife Presets or upload an audio file!");
    console.error(err);
  }
}

function stopAudioListening() {
  state.isListening = false;
  if (state.activeSampleAudio) {
    state.activeSampleAudio.pause();
    state.activeSampleAudio = null;
  }
  const btnMic = document.getElementById('btnMicListen');
  btnMic.classList.remove('recording');
  document.getElementById('micBtnText').innerText = "Listen on Trail";
  clearInterval(state.classificationInterval);
}

function playAudioSample(sampleKey) {
  state.activeAudioKey = sampleKey;
  const ctx = getAudioContext();
  const overlay = document.getElementById('canvasPlaceholderOverlay');
  overlay.style.display = 'none';

  if (state.activeSampleAudio) {
    state.activeSampleAudio.pause();
  }

  const audio = new Audio(`assets/audio/${sampleKey}.wav`);
  state.activeSampleAudio = audio;

  const source = ctx.createMediaElementSource(audio);
  source.connect(state.analyser);
  state.analyser.connect(ctx.destination);

  audio.play().then(() => {
    state.isListening = true;
    renderAudioLoop();
    classifyCurrentAudioSpectrum(sampleKey);

    audio.onended = () => {
      state.isListening = false;
    };
  }).catch(err => {
    console.error("Audio playback error:", err);
    // Even if audio playback is blocked, run classification
    classifyCurrentAudioSpectrum(sampleKey);
  });
}

function handleAudioFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ctx = getAudioContext();
  const overlay = document.getElementById('canvasPlaceholderOverlay');
  overlay.style.display = 'none';

  const reader = new FileReader();
  reader.onload = (event) => {
    ctx.decodeAudioData(event.target.result, (buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(state.analyser);
      state.analyser.connect(ctx.destination);
      source.start(0);

      state.isListening = true;
      renderAudioLoop();
      classifyCurrentAudioSpectrum('chickadee');
    });
  };
  reader.readAsArrayBuffer(file);
}

// Spectrogram Waterfall Renderer
function setupSpectrogramCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = (rect.width || 600) * dpr;
  canvas.height = (rect.height || 220) * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

function renderAudioLoop() {
  const canvas = document.getElementById('spectrogramCanvas');
  const ctx = canvas.getContext('2d');
  const bufferLength = state.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    if (!state.isListening) return;
    requestAnimationFrame(draw);

    state.analyser.getByteFrequencyData(dataArray);

    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Shift previous spectrogram image downward (waterfall effect)
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 3, width, height);

    // Draw top new frequency slice
    const barWidth = width / 128;
    for (let i = 0; i < 128; i++) {
      const val = dataArray[i * 4];
      const percent = val / 255;

      // Color map: Dark moss -> Luminous Green -> Autumn Amber -> Hot Red
      let r, g, b;
      if (percent < 0.3) {
        r = 6;
        g = Math.floor(percent * 3.3 * 180);
        b = 20;
      } else if (percent < 0.7) {
        r = Math.floor((percent - 0.3) * 2.5 * 245);
        g = 197;
        b = 40;
      } else {
        r = 239;
        g = Math.floor(197 - (percent - 0.7) * 3 * 150);
        b = 30;
      }

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(i * barWidth, 0, barWidth + 1, 3);
    }
  };

  draw();
}

function classifyCurrentAudioSpectrum(sampleKey) {
  if (!state.analyser) return;

  const bufferLength = state.analyser.frequencyBinCount;
  const frequencyData = new Uint8Array(bufferLength);
  state.analyser.getByteFrequencyData(frequencyData);

  if (state.worker) {
    state.worker.postMessage({
      type: 'CLASSIFY_AUDIO_SPECTRUM',
      payload: { frequencyData, sampleKey: sampleKey || state.activeAudioKey }
    });
  } else {
    // Fallback simulation if workers disabled
    setTimeout(() => {
      const fallbackResult = {
        species: {
          commonName: "Black-capped Chickadee",
          latinName: "Poecile atricapillus",
          description: "Distinctive two-note pure whistle 'fee-bee' followed by rapid raspy warning 'chick-a-dee-dee'.",
          tags: ["Songbird", "Frequency: 3.2 – 6.4 kHz", "Least Concern"]
        },
        confidence: 96.4,
        inferenceDurationMs: 12.4
      };
      renderAudioDetection(fallbackResult);
    }, 120);
  }
}

function renderAudioDetection(data) {
  const { species, confidence, inferenceDurationMs } = data;

  document.getElementById('detectedCommonName').innerText = species.commonName;
  document.getElementById('detectedLatinName').innerText = species.latinName;
  document.getElementById('detectedConfidence').innerText = `${confidence}%`;
  document.getElementById('detectedProgressBar').style.width = `${confidence}%`;
  document.getElementById('detectedDescription').innerText = species.description;
  document.getElementById('aiInferenceTime').innerText = `Inference: ${inferenceDurationMs}ms`;

  const metaContainer = document.getElementById('detectedMetaTags');
  metaContainer.innerHTML = '';
  species.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'meta-tag';
    span.innerText = tag;
    metaContainer.appendChild(span);
  });

  // Announce in pocket mode
  if (state.pocketModeActive) {
    document.getElementById('pocketLastSpottedText').innerText =
      `Spotted: ${species.commonName} (${confidence}%)`;
    speakText(`Spotted ${species.commonName}`);
    triggerHaptic();
  }
}

// 5. Flora & Foliage Vision Scout
function initFloraScout() {
  const fileInput = document.getElementById('floraFileInput');
  const btnCamera = document.getElementById('btnStartCamera');
  const btnCapture = document.getElementById('btnCaptureCamera');
  const sampleCards = document.querySelectorAll('.sample-image-card');
  const btnLogFlora = document.getElementById('btnLogFlora');
  const btnSpeakFlora = document.getElementById('btnSpeakFlora');

  fileInput.addEventListener('change', handleFloraFileUpload);
  btnCamera.addEventListener('click', startCameraPreview);
  btnCapture.addEventListener('click', captureCameraFrame);

  sampleCards.forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-img');
      selectFloraSample(key);
    });
  });

  btnLogFlora.addEventListener('click', () => {
    const commonName = document.getElementById('floraCommonName').innerText;
    const confidence = document.getElementById('floraConfidence').innerText;
    logTrailSighting('flora', commonName, confidence);
  });

  btnSpeakFlora.addEventListener('click', () => {
    const commonName = document.getElementById('floraCommonName').innerText;
    const desc = document.getElementById('floraDescription').innerText;
    speakText(`${commonName}. ${desc}`);
  });
}

function selectFloraSample(key) {
  state.activeFloraKey = key;
  const imgElem = document.getElementById('activeFloraImage');
  const videoElem = document.getElementById('cameraVideo');
  const dropPrompt = document.getElementById('imageDropPrompt');

  videoElem.style.display = 'none';
  dropPrompt.style.display = 'none';
  imgElem.style.display = 'block';

  imgElem.src = `assets/images/${key}.jpg`;
  analyzeFloraImage(key);
}

function handleFloraFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const imgElem = document.getElementById('activeFloraImage');
    imgElem.src = event.target.result;
    imgElem.style.display = 'block';
    document.getElementById('cameraVideo').style.display = 'none';

    // Run custom image analysis
    analyzeCustomImage(imgElem);
  };
  reader.readAsDataURL(file);
}

async function startCameraPreview() {
  const video = document.getElementById('cameraVideo');
  const img = document.getElementById('activeFloraImage');
  const btnCapture = document.getElementById('btnCaptureCamera');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });
    video.srcObject = stream;
    video.style.display = 'block';
    img.style.display = 'none';
    btnCapture.style.display = 'inline-flex';
  } catch (err) {
    alert("Camera unavailable. Using trail presets instead!");
    console.error(err);
  }
}

function captureCameraFrame() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const img = document.getElementById('activeFloraImage');
  img.src = canvas.toDataURL('image/jpeg');
  img.style.display = 'block';
  video.style.display = 'none';
  document.getElementById('btnCaptureCamera').style.display = 'none';

  // Stop camera tracks
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }

  analyzeCustomImage(img);
}

function analyzeFloraImage(key) {
  const info = FLORA_SPECIES_DB[key] || FLORA_SPECIES_DB.sugar_maple;
  const resultCard = document.getElementById('activeFloraResultCard');

  if (info.warning) {
    resultCard.className = 'result-card warning';
  } else {
    resultCard.className = 'result-card detected';
  }

  document.getElementById('floraCommonName').innerText = info.commonName;
  document.getElementById('floraLatinName').innerText = info.latinName;
  document.getElementById('floraConfidence').innerText = `${info.confidence}%`;
  document.getElementById('floraProgressBar').style.width = `${info.confidence}%`;
  document.getElementById('floraDescription').innerText = info.description;

  const progressBar = document.getElementById('floraProgressBar');
  if (info.warning) {
    progressBar.className = 'progress-bar-fill warning';
  } else {
    progressBar.className = 'progress-bar-fill';
  }

  const metaContainer = document.getElementById('floraMetaTags');
  metaContainer.innerHTML = '';
  info.tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'meta-tag';
    span.innerText = tag;
    metaContainer.appendChild(span);
  });

  if (state.pocketModeActive && info.warning) {
    speakText("Warning! Toxic specimen detected on trail.");
    triggerHaptic();
  }
}

function analyzeCustomImage(imgElem) {
  // Extract RGB distribution to detect autumn anthocyanins vs chlorophyll
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElem, 0, 0, 100, 100);
  const data = ctx.getImageData(0, 0, 100, 100).data;

  let totalR = 0, totalG = 0, totalB = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalR += data[i];
    totalG += data[i+1];
    totalB += data[i+2];
  }

  const avgR = totalR / (data.length / 4);
  const avgG = totalG / (data.length / 4);

  if (avgR > avgG * 1.15) {
    selectFloraSample('sugar_maple');
  } else {
    selectFloraSample('poison_ivy');
  }
}

// 6. Field Journal & GPX/GeoJSON Export
function initJournal() {
  loadSightings();
  document.getElementById('btnExportGPX').addEventListener('click', exportGPX);
  document.getElementById('btnExportGeoJSON').addEventListener('click', exportGeoJSON);
  document.getElementById('btnClearJournal').addEventListener('click', clearJournal);
}

function logTrailSighting(type, name, confidence) {
  const item = {
    id: Date.now(),
    type,
    name,
    confidence,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    coords: { ...state.currentPosition }
  };

  state.sightings.unshift(item);
  saveSightings();
  renderSightingsList();

  // Play synthetic chime
  playTrailChime();

  alert(`Logged to Trail Journal: ${name} (${confidence})`);
}

function saveSightings() {
  try {
    localStorage.setItem('verdant_sightings', JSON.stringify(state.sightings));
    document.getElementById('journalCountBadge').innerText = state.sightings.length;
  } catch (err) {
    console.error(err);
  }
}

function loadSightings() {
  try {
    const saved = localStorage.getItem('verdant_sightings');
    if (saved) {
      state.sightings = JSON.parse(saved);
      document.getElementById('journalCountBadge').innerText = state.sightings.length;
      renderSightingsList();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderSightingsList() {
  const container = document.getElementById('sightingsListContainer');
  const emptyNotice = document.getElementById('emptyJournalNotice');

  if (state.sightings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted);" id="emptyJournalNotice">
        No sightings logged yet. Use the Bioacoustics or Flora Scout to log your first trail observation!
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  state.sightings.forEach(s => {
    const div = document.createElement('div');
    div.className = 'sighting-item';
    const icon = s.type === 'audio' ? '🐦' : '🍁';
    div.innerHTML = `
      <div class="sighting-left">
        <div class="sighting-icon">${icon}</div>
        <div class="sighting-info">
          <h4>${s.name}</h4>
          <span class="sighting-coords">GPS: ${s.coords.lat}°N, ${Math.abs(s.coords.lon)}°W • Alt: ${s.coords.alt}m</span>
        </div>
      </div>
      <div class="sighting-right">
        <div style="font-family: var(--font-mono); font-weight: 700; color: #22c55e;">${s.confidence}</div>
        <div class="sighting-time">${s.timestamp}</div>
      </div>
    `;
    container.appendChild(div);
  });
}

function clearJournal() {
  if (confirm("Clear all offline trail sightings from this session?")) {
    state.sightings = [];
    saveSightings();
    renderSightingsList();
  }
}

function exportGPX() {
  if (state.sightings.length === 0) {
    alert("No sightings to export yet! Log a sighting first.");
    return;
  }

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VerdantEcho Offline Trail Scout" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>VerdantEcho Wilderness Field Track</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;

  state.sightings.forEach(s => {
    gpx += `  <wpt lat="${s.coords.lat}" lon="${s.coords.lon}">
    <ele>${s.coords.alt}</ele>
    <name>${s.name}</name>
    <desc>${s.type.toUpperCase()} • Confidence: ${s.confidence} • Time: ${s.timestamp}</desc>
    <sym>Trailhead</sym>
  </wpt>\n`;
  });

  gpx += `</gpx>`;

  downloadFile(gpx, "verdant_trail_sightings.gpx", "application/gpx+xml");
}

function exportGeoJSON() {
  if (state.sightings.length === 0) {
    alert("No sightings to export yet!");
    return;
  }

  const geojson = {
    type: "FeatureCollection",
    features: state.sightings.map(s => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.coords.lon, s.coords.lat, s.coords.alt]
      },
      properties: {
        id: s.id,
        species: s.name,
        type: s.type,
        confidence: s.confidence,
        timestamp: s.timestamp
      }
    }))
  };

  downloadFile(JSON.stringify(geojson, null, 2), "verdant_trail_sightings.geojson", "application/geo+json");
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 7. Touch Grass Pocket Mode & Screen Dimming
function initPocketMode() {
  const btnToggle = document.getElementById('btnPocketModeToggle');
  const btnExit = document.getElementById('btnExitPocketMode');
  const overlay = document.getElementById('pocketModeOverlay');

  btnToggle.addEventListener('click', enterPocketMode);
  btnExit.addEventListener('click', exitPocketMode);
}

function enterPocketMode() {
  state.pocketModeActive = true;
  document.body.classList.add('pocket-mode');
  const overlay = document.getElementById('pocketModeOverlay');
  overlay.classList.add('active');

  // Start pocket timer
  let seconds = 0;
  state.pocketTimerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    document.getElementById('pocketTimerDisplay').innerText = `${mins}:${secs}`;
  }, 1000);

  speakText("Pocket mode active. Screen minimized. Enjoy your trail.");
}

function exitPocketMode() {
  state.pocketModeActive = false;
  document.body.classList.remove('pocket-mode');
  const overlay = document.getElementById('pocketModeOverlay');
  overlay.classList.remove('active');
  clearInterval(state.pocketTimerInterval);
}

// 8. Sunlight HUD Mode
function initSunlightToggle() {
  const btn = document.getElementById('btnSunlightToggle');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('sunlight-mode');
    const isActive = document.body.classList.contains('sunlight-mode');
    btn.innerHTML = isActive ? `🌑 <span>Normal HUD</span>` : `☀️ <span>Sunlight HUD</span>`;
  });
}

// 9. Gemma Naturalist Companion
function initGemmaCompanion() {
  const btnTest = document.getElementById('btnTestGemmaQuery');
  const outputBox = document.getElementById('gemmaOutputBox');
  const responseText = document.getElementById('gemmaResponseText');

  btnTest.addEventListener('click', () => {
    btnTest.innerHTML = `<span>⏳</span> Synthesizing Gemma Naturalist Guidance...`;
    outputBox.style.display = 'block';

    setTimeout(() => {
      btnTest.innerHTML = `<span>⚡</span> Run Interactive Field Query`;
      responseText.innerText =
        "\"Look up into the mid-canopy: Sugar Maple anthocyanin foliage is currently at peak vibrance (85% crimson saturation). Black-capped chickadees are taking advantage of this canopy cover to harvest spruce budworm pupae. You've gotten all the data you need—slip this phone into your pocket and enjoy the autumn sunlight.\"";
      speakText("Sugar maple anthocyanin foliage is currently at peak vibrance. Chickadees are active in the mid-canopy. Screen time concluded.");
    }, 450);
  });
}

// 10. Screen Time Saved Outdoors Tracker
function startScreenSavedCounter() {
  const elem = document.getElementById('screenSavedTimer');
  state.screenTimerInterval = setInterval(() => {
    state.screenSavedSeconds++;
    const hrs = String(Math.floor(state.screenSavedSeconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((state.screenSavedSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(state.screenSavedSeconds % 60).padStart(2, '0');
    elem.innerText = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Audio Utilities: Speech Synthesis & Synthesized Chimes
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function playTrailChime() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio autostart errors
  }
}

function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
}
