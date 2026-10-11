# 🌿 VerdantEcho: Zero-Signal Trail Scout & Bioacoustics AI

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest%202026-Week%201%20Touch%20Grass-22c55e.svg)](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Privacy](https://img.shields.io/badge/Telemetry-0%25%20Offline-blue.svg)](#why-open-innovation-matters)

> **"Build something with open-source AI at its core that gets people off the screen and into the world. The best builds here should make the screen the shortest part of the experience."**  
> — *Hacktoberfest Open-Source AI Challenge: Week 1 (Touch Grass)*

---

## 🍃 Overview

**VerdantEcho** is an offline-first, backcountry trail scout and bioacoustics neural classifier engineered for one primary purpose: **to minimize your screen time and immerse you in the natural world.**

When hiking through deep backcountry valleys, national parks, or remote woodlands, cell towers disappear. Cloud-based AI APIs (OpenAI, Claude, cloud computer vision) fail with timeout errors. Even worse, typical mobile apps encourage you to stare at a glowing piece of glass while walking through magnificent old-growth canopies.

VerdantEcho fundamentally re-engineers outdoor exploration using open-weight AI:

1. **🔊 On-Device Bioacoustics Scout**: Real-time Web Audio API FFT spectrogram + neural audio pattern extraction running in an isolated Web Worker. Classifies songbirds (Black-capped Chickadees, Robins, Red-tailed Hawks, Song Sparrows) and autumn crickets without sending 1 byte of audio over the network.
2. **🍁 Autumn Foliage & Flora Vision**: Evaluates anthocyanin crimson saturation, leaf morphology, and canopy stages. Features an immediate safety detector for contact hazards like **Poison Ivy** (*Toxicodendron radicans*).
3. **❄️ Frost & Soil Almanac**: Computes first expected frost dates, hardiness zones, and optimal cold-hardy planting/foraging windows (hardneck garlic, winter rye, winter squash harvest) based on date and offline coordinates.
4. **🌲 "Touch Grass" Pocket Mode**: Converts your display into an ultra-low-power AMOLED HUD. Employs speech synthesis and directional chimes to announce sightings into your headphones, automatically dimming the screen so your device stays in your pocket.
5. **📍 Offline Field Journal & GPX Exporter**: Logs every wilderness encounter with offline GPS waypoints into browser storage, exportable as standard `.gpx` or `.geojson` for Gaia GPS, AllTrails, or OpenStreetMap.
6. **🤖 Gemma 2B Naturalist Engine**: Integrates open-weight Google Gemma 2B prompting for concise 2-sentence natural history insights with strict instructions to put your screen away.

---

## 💡 Why Open Innovation Matters

In our build, open-source AI isn't an afterthought or an optional toggle—**it is the only reason the project works**:

- **Backcountry Zero-Signal Reliability**: Proprietary cloud AI requires high-speed cellular data. By utilizing open-weight neural feature extraction directly in the browser and on local hardware, VerdantEcho functions seamlessly with airplane mode active.
- **True Location & Biological Privacy**: Hikers and foragers often track rare plant colonies or sensitive wildlife habitats. Closed commercial platforms harvest GPS coordinates and biometric audio for cloud databases. With open-source local inference, zero coordinates leave your device.
- **Zero Ongoing API Costs**: No token bills, rate limits, or monthly recurring subscriptions.
- **Model Inspectability & Community Tunability**: Open weights can be fine-tuned for local microclimates (e.g. Pacific Northwest mosses vs. Appalachian hardwoods) and quantized to run on low-power Raspberry Pi trail rigs.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                      VerdantEcho                       │
├──────────────────────────┬─────────────────────────────┤
│  Browser Client (PWA)    │  Local Edge CLI / Headless  │
│  - Vanilla HTML5 / CSS3  │  - Python 3.14 CLI Runner   │
│  - Web Audio API FFT     │  - Gemma 2B Prompt Pipeline │
│  - Dedicated Web Worker  │  - Zero Network Telemetry   │
│  - IndexedDB Journal     │                             │
│  - GPX / GeoJSON Export  │                             │
└──────────────────────────┴─────────────────────────────┘
```

- **Frontend Core**: Vanilla HTML5 & CSS3 with custom design system (Bioluminescent Moss `#22C55E`, Autumn Amber `#F59E0B`, Forest Slate `#060D09`).
- **Web Worker Threading**: Audio spectrum math runs in `ai-worker.js` to ensure the main UI never stutters or drops below 60fps (incorporating Dev.to Community Wisdom on in-browser WebGPU/WASM memory isolation).
- **Service Worker (`sw.js`)**: Pre-caches all scripts, stylesheets, authentic field images, and audio waveforms for 100% offline trail performance.
- **Edge CLI (`gemma_field_scout.py`)**: Demonstrates local open-weight execution formatted for Gemma turn structures.

---

## 🚀 Quickstart & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ayushraaj-01/verdantecho.git
cd verdantecho
```

### 2. Run the Local Web Server
```bash
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Test the Gemma Field Scout CLI (Offline)
```bash
python gemma_field_scout.py --species "Black-capped Chickadee" --notes "Caching seeds in hemlock bark"
```

---

## 🌐 Community Wisdom & Provenance

During architectural design, we surveyed recent research and developer benchmarks on [dev.to](https://dev.to):
1. **Thread Isolation**: [Three things that broke when I moved AI image models into the browser](https://dev.to/mno_tao_236ab4649edf4cf9f/three-things-that-broke-when-i-moved-ai-image-models-into-the-browser-4ai5) by *@mno_tao_236ab4649edf4cf9f* emphasized isolating tensor computations in Web Workers to prevent main thread rendering lag.
2. **In-Browser Inference**: [Running Machine Learning Models in the Browser Using onnxruntime-web](https://dev.to/dinakajoy/running-machine-learning-models-in-the-browser-using-onnxruntime-web-3klc) by *@dinakajoy* highlighted client-side ONNX efficiency for privacy-first web apps.
3. **Core Web Vitals**: [I Ran AI Models Directly in the Browser and Measured What It Did to Core Web Vitals](https://dev.to/mspk97/i-ran-ai-models-directly-in-the-browser-and-measured-what-it-did-to-core-web-vitals-4adj) by *@mspk97* informed our lightweight canvas pipeline.

---

## 🏆 Hacktoberfest 2026 Categories

- **Primary Challenge**: Hacktoberfest Open-Source AI Challenge: Week 1 — *Touch Grass* (`#hf26challenge`)
- **Featured Category**: *Best Use of Gemma* (Open-weight naturalist reasoning via prompt templates & local Python CLI)
- **Partner Category**: *Best Use of Render* (`render.yaml` 1-click deployment included)

---

## 📜 License

MIT License. Designed with care for outdoor adventurers everywhere.
