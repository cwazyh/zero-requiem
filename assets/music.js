const AUDIO_BASE = "assets/music/";
const FALLBACK_COVER = "assets/logo.png";
const VISIT_KEY = "zr_soundtrack_visited_v1";
const FIRST_TRACK_FILE = "colors-flow.mp3";
const DEFAULT_VOLUME = 0.7;
const FADE_SECONDS = 8;
const MODE_KEY = "zr_soundtrack_mode";

const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
  previous: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 6v12H5V6h2zm2 6l9 6V6l-9 6z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 6v12h2V6h-2zm-2 6L6 6v12l9-6z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-6.3 6.3-1.4-1.4L17.6 5H14V3zM3 6h4.5l3.5 4-1.4 1.4L6.5 8H3V6zm18 9v6h-7v-2h3.6l-6.3-6.3 1.4-1.4L19 17.6V15h2z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
  volume: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9v6h4l5 5V4L8 9H4zm12.6 3 2.2-2.2-1.4-1.4-2.2 2.2-2.2-2.2-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4-2.2-2.2z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 20.5S4.5 16 4.5 10.8A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16 12 20.5 12 20.5z"/></svg>',
  heartFill: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5S4.5 16 4.5 10.8A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16 12 20.5 12 20.5z"/></svg>',
  queue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15V6l-6 3V3"/><path d="M3 6h12"/><path d="M3 12h8"/><path d="M3 18h8"/><circle cx="18" cy="18" r="3"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="5" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="9" cy="19" r="1.4"/><circle cx="15" cy="5" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="15" cy="19" r="1.4"/></svg>',
};

const audio = document.getElementById("mp-audio");
const player = document.getElementById("music-player");
const cover = document.getElementById("mp-cover");
const titleNode = document.getElementById("mp-title");
const artistNode = document.getElementById("mp-artist");
const playButton = document.getElementById("mp-play");
const previousButton = document.getElementById("mp-prev");
const nextButton = document.getElementById("mp-next");
const modeButton = document.getElementById("mp-mode");
const seekInput = document.getElementById("mp-seek");
const currentNode = document.getElementById("mp-current");
const durationNode = document.getElementById("mp-duration");
const volumeToggle = document.getElementById("mp-volume");
const volumeWrap = volumeToggle ? volumeToggle.closest(".mp-volume-wrap") : null;
const volumePopup = document.getElementById("mp-volume-popup");
const volumeTrack = document.getElementById("mp-volume-track");
const volumeFill = document.getElementById("mp-volume-fill");
const volumePercent = document.getElementById("mp-volume-percent");
const popupMuteButton = document.getElementById("mp-popup-mute");
const likeButton = document.getElementById("mp-like");
const queueButton = document.getElementById("mp-queue");
const queuePopup = document.getElementById("mp-queue-popup");
const queueList = document.getElementById("mp-queue-list");
const queueCount = document.getElementById("mp-queue-count");
const trackList = document.getElementById("track-list");

let tracks = [];
let currentIndex = 0;
let playbackMode = "shuffle";
let lastVolume = DEFAULT_VOLUME;
let autoplayBlocked = false;
let seeking = false;
let resumeAfterSeek = false;
let volumePinned = false;
let volumeCloseTimer = null;
let queuePinned = false;
let queueCloseTimer = null;
let queueDragging = false;
let suppressQueueClickUntil = 0;
let draggedIndex = null;
const durations = new Map();
const placeholderCovers = new Map();

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    return;
  }
}

function isFirstVisit() {
  return readStorage(VISIT_KEY) !== "1";
}

function markVisited() {
  writeStorage(VISIT_KEY, "1");
}

function profileModeKey() {
  const id = window.ZR_PROFILE && window.ZR_PROFILE.id;
  return id ? `${MODE_KEY}_${id}` : MODE_KEY;
}

function restoreMode() {
  const stored = readStorage(profileModeKey());
  playbackMode = stored === "loop" || stored === "shuffle" ? stored : "shuffle";
  updateModeIcon();
}

function rememberMode() {
  writeStorage(profileModeKey(), playbackMode);
  if (window.ZR_PROFILE && window.ZR_PROFILE.id) writeStorage(MODE_KEY, playbackMode);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function applyCoverAccent(image) {
  if (!player || !image) return;
  const source = image.src || image.currentSrc;
  if (source) player.style.setProperty("--queue-cover", `url("${source}")`);
  const fallback = () => {
    player.classList.remove("light-art");
    player.style.setProperty("--mp-accent-start", "rgb(30, 31, 34)");
    player.style.setProperty("--mp-accent-mid", "rgb(44, 47, 52)");
    player.style.setProperty("--mp-accent-end", "rgb(20, 22, 22)");
    player.style.setProperty("--mp-accent-solid", "#3a4145");
  };
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return fallback();
    context.drawImage(image, 0, 0, 64, 64);
    const data = context.getImageData(0, 0, 64, 64).data;
    const bucketCount = 24;
    const weights = new Array(bucketCount).fill(0);
    const reds = new Array(bucketCount).fill(0);
    const greens = new Array(bucketCount).fill(0);
    const blues = new Array(bucketCount).fill(0);
    let luminanceTotal = 0;
    let luminanceCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3] / 255;
      luminanceTotal += (0.2126 * r + 0.7152 * g + 0.0722 * b) * alpha;
      luminanceCount += alpha;
      const [hue, saturation, lightness] = rgbToHsl(r, g, b);
      if (lightness < 0.1 || lightness > 0.95 || saturation < 0.2) continue;
      const weight = saturation * (1 - Math.abs(lightness - 0.55) * 0.7);
      const bucket = Math.min(bucketCount - 1, Math.floor(hue * bucketCount));
      weights[bucket] += weight;
      reds[bucket] += r * weight;
      greens[bucket] += g * weight;
      blues[bucket] += b * weight;
    }
    const candidates = [];
    for (let bucket = 0; bucket < bucketCount; bucket += 1) {
      if (weights[bucket] <= 0) continue;
      const r = Math.round(reds[bucket] / weights[bucket]);
      const g = Math.round(greens[bucket] / weights[bucket]);
      const b = Math.round(blues[bucket] / weights[bucket]);
      const [hue, saturation, lightness] = rgbToHsl(r, g, b);
      candidates.push({ hue, saturation, lightness, weight: weights[bucket] });
    }
    candidates.sort((first, second) => second.weight - first.weight);
    const picked = [];
    for (const candidate of candidates) {
      const distinct = picked.every((item) => {
        const distance = Math.abs(item.hue - candidate.hue);
        return Math.min(distance, 1 - distance) > 0.1;
      });
      if (distinct) picked.push(candidate);
      if (picked.length === 3) break;
    }
    if (!picked.length) return fallback();
    const averageLuminance = luminanceCount > 0 ? luminanceTotal / luminanceCount / 255 : 0;
    player.classList.toggle("light-art", averageLuminance > 0.58);
    picked.sort((first, second) => first.hue - second.hue);
    const stops = picked.map(({ hue, saturation, lightness }) => {
      const safeSaturation = Math.max(0.55, saturation);
      const safeLightness = Math.min(0.82, Math.max(0.48, lightness));
      const [r, g, b] = hslToRgb(hue, safeSaturation, safeLightness);
      return `rgb(${r}, ${g}, ${b})`;
    });
    while (stops.length < 3) stops.push(stops[0]);
    player.style.setProperty("--mp-accent-start", stops[0]);
    player.style.setProperty("--mp-accent-mid", stops[1]);
    player.style.setProperty("--mp-accent-end", stops[2]);
    player.style.setProperty("--mp-accent-solid", stops[0]);
  } catch (_) {
    fallback();
  }
}

function hashTrack(track) {
  const value = `${track.file}|${track.title}|${track.artist}`;
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function placeholderCover(track) {
  if (placeholderCovers.has(track.file)) return placeholderCovers.get(track.file);
  const palettes = [
    ["#2c393d", "#4c595d"],
    ["#141616", "#4c595d"],
    ["#4c595d", "#cccfd2"],
    ["#440000", "#2c393d"],
    ["#2c393d", "#5865f2"],
  ];
  const hash = hashTrack(track);
  const [from, to] = palettes[hash % palettes.length];
  const initials = String(track.title || "ZR")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "ZR";

  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  if (!context) {
    placeholderCovers.set(track.file, FALLBACK_COVER);
    return FALLBACK_COVER;
  }
  const gradient = context.createLinearGradient(0, 0, 96, 96);
  gradient.addColorStop(0, to);
  gradient.addColorStop(1, from);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  const glow = context.createRadialGradient(74, 22, 4, 74, 22, 70);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.24)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 96, 96);
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = "600 30px -apple-system, BlinkMacSystemFont, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(initials, 48, 48);
  context.fillStyle = "rgba(255, 255, 255, 0.42)";
  context.font = "600 9px -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("ZR // AUDIO", 48, 82);
  const dataUrl = canvas.toDataURL("image/png");
  placeholderCovers.set(track.file, dataUrl);
  return dataUrl;
}

function coverSource(track) {
  return track.cover ? `${AUDIO_BASE}covers/${track.cover}` : placeholderCover(track);
}

function createDragGhost(track) {
  const ghost = document.createElement("div");
  ghost.className = "mp-queue-drag-ghost";

  const image = document.createElement("img");
  image.src = coverSource(track);
  image.alt = "";

  const copy = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = track.title;
  const artist = document.createElement("span");
  artist.textContent = track.artist;
  copy.append(name, artist);

  ghost.append(image, copy);
  document.body.appendChild(ghost);
  return ghost;
}

function setIcon(button, icon, label) {
  if (!button) return;
  button.innerHTML = ICONS[icon];
  button.setAttribute("aria-label", label);
}

function updatePlayIcon() {
  const playing = !audio.paused && !audio.ended;
  setIcon(playButton, playing ? "pause" : "play", playing ? "Pause" : "Play");
}

function updateModeIcon() {
  const random = playbackMode === "shuffle";
  const label = random ? "Random soundtrack" : "Loop soundtrack";
  setIcon(modeButton, random ? "shuffle" : "repeat", label);
  modeButton.title = label;
  modeButton.classList.add("active");
  modeButton.setAttribute("aria-pressed", String(random));
}

function updateVolumeIcons() {
  const muted = audio.muted || audio.volume === 0;
  const icon = muted ? "mute" : "volume";
  setIcon(volumeToggle, icon, muted ? "Unmute" : "Volume");
  setIcon(popupMuteButton, icon, muted ? "Unmute" : "Mute");
}

function updateVolumeVisual() {
  const level = audio.muted ? 0 : audio.volume;
  const percentage = Math.round(level * 100);
  if (volumeFill) volumeFill.style.height = `${percentage}%`;
  if (volumePercent) volumePercent.textContent = `${percentage}%`;
  if (volumeTrack) volumeTrack.setAttribute("aria-valuenow", String(percentage));
  updateVolumeIcons();
}

function setVolume(level) {
  const clamped = Math.min(1, Math.max(0, level));
  if (clamped > 0) lastVolume = clamped;
  audio.volume = clamped;
  audio.muted = clamped === 0;
  audio.defaultMuted = false;
  autoplayBlocked = false;
  updateVolumeVisual();
}

function toggleMute() {
  if (audio.muted || audio.volume === 0) setVolume(lastVolume || DEFAULT_VOLUME);
  else setVolume(0);
}

function updateLikeButton(track) {
  if (!likeButton || !track) return;
  const liked = readStorage(`zr_soundtrack_like_${track.file}`) === "1";
  setIcon(likeButton, liked ? "heartFill" : "heart", liked ? "Remove from favourites" : "Add to favourites");
  likeButton.setAttribute("aria-pressed", String(liked));
}

function updateActiveRow() {
  document.querySelectorAll(".track-row, .mp-queue-row").forEach((row) => {
    const index = Number(row.dataset.index);
    const active = index === currentIndex;
    row.classList.toggle("active", active);
    if (active) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
}

function setProgress(value) {
  const clamped = Math.min(100, Math.max(0, value));
  if (seekInput) {
    seekInput.value = String(clamped);
    seekInput.style.setProperty("--progress", `${clamped}%`);
  }
  if (player) {
    player.style.setProperty("--mp-progress-scale", String(clamped / 100));
  }
}

function updateSeekVisual() {
  const duration = audio.duration;
  const value = Number.isFinite(duration) && duration > 0
    ? (audio.currentTime / duration) * 100
    : 0;
  setProgress(value);
  currentNode.textContent = formatTime(audio.currentTime);
  durationNode.textContent = formatTime(duration);
}

let fadeFrame = null;

function cancelFade() {
  if (fadeFrame !== null) {
    window.cancelAnimationFrame(fadeFrame);
    fadeFrame = null;
  }
}

function fadeInVolume() {
  cancelFade();
  const started = performance.now();
  const duration = FADE_SECONDS * 1000;
  const step = (now) => {
    const t = Math.min(1, (now - started) / duration);
    const eased = t * t * (3 - 2 * t);
    setVolume(DEFAULT_VOLUME * eased);
    if (t < 1) fadeFrame = window.requestAnimationFrame(step);
    else fadeFrame = null;
  };
  fadeFrame = window.requestAnimationFrame(step);
}

async function beginPlayback() {
  if (!audio.src) return;
  cancelFade();
  audio.muted = false;
  audio.defaultMuted = false;
  audio.volume = 0;
  autoplayBlocked = false;
  updateVolumeVisual();
  try {
    await audio.play();
  } catch (_) {
    audio.muted = true;
    autoplayBlocked = true;
    try {
      await audio.play();
    } catch (_) {
      updatePlayIcon();
      updateVolumeVisual();
      return;
    }
  }
  fadeInVolume();
  updatePlayIcon();
  updateVolumeVisual();
}

window.addEventListener("zr:access", beginPlayback, { once: true });

async function playAudio() {
  try {
    await audio.play();
    autoplayBlocked = false;
  } catch (_) {
    audio.muted = true;
    audio.volume = 0;
    autoplayBlocked = true;
    try {
      await audio.play();
    } catch (_) {
      updatePlayIcon();
      updateVolumeVisual();
      return;
    }
  }
  updateVolumeVisual();
  updatePlayIcon();
}

function togglePlay() {
  cancelFade();
  if (!audio.src) return;
  if (audio.paused) playAudio();
  else audio.pause();
}

function selectTrack(index, autoplay = false) {
  if (!tracks.length) return;
  currentIndex = (index + tracks.length) % tracks.length;
  const track = tracks[currentIndex];
  audio.src = `${AUDIO_BASE}${track.file}`;
  titleNode.textContent = track.title;
  artistNode.textContent = track.artist;
  cover.onerror = () => {
    cover.onerror = null;
    cover.src = placeholderCover(track);
    applyCoverAccent(cover);
  };
  cover.onload = () => applyCoverAccent(cover);
  const artSource = coverSource(track);
  cover.src = artSource;
  player.style.setProperty("--queue-cover", `url("${artSource}")`);
  if (cover.complete && cover.naturalWidth) applyCoverAccent(cover);
  updateLikeButton(track);
  updateActiveRow();
  updateSeekVisual();
  if (autoplay) playAudio();
}

function shuffleOrder() {
  for (let i = tracks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
}

function nextIndex(direction) {
  if (playbackMode === "shuffle" && tracks.length > 1) {
    let candidate = currentIndex;
    while (candidate === currentIndex) candidate = Math.floor(Math.random() * tracks.length);
    return candidate;
  }
  return (currentIndex + direction + tracks.length) % tracks.length;
}

function handleEnded() {
  selectTrack(nextIndex(1), true);
}

function reorderTrack(from, to) {
  if (from === null || from < 0 || to < 0 || from >= tracks.length || to > tracks.length) return;
  const currentTrack = tracks[currentIndex];
  const [moved] = tracks.splice(from, 1);
  const target = to > from ? to - 1 : to;
  tracks.splice(Math.min(target, tracks.length), 0, moved);
  currentIndex = Math.max(0, tracks.indexOf(currentTrack));
  buildTrackList();
  buildQueueList();
}

function clearDropMarks() {
  if (!queueList) return;
  queueList.querySelectorAll(".mp-queue-row").forEach((row) => row.classList.remove("drop-before", "drop-after"));
}

function clearDragMarks() {
  document.querySelectorAll(".mp-queue-drag-ghost").forEach((ghost) => ghost.remove());
  if (!queueList) return;
  queueList.classList.remove("dragging");
  queueList.querySelectorAll(".mp-queue-row").forEach((row) => row.classList.remove("dragging", "drop-before", "drop-after"));
}

function buildTrackList() {
  if (!trackList) return;
  trackList.textContent = "";
  tracks.forEach((track, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "track-row";
    row.dataset.index = String(index);
    row.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);

    const image = document.createElement("img");
    image.src = coverSource(track);
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => { image.onerror = null; image.src = placeholderCover(track); };

    const copy = document.createElement("span");
    copy.className = "track-copy";
    const name = document.createElement("strong");
    name.textContent = track.title;
    const artist = document.createElement("span");
    artist.textContent = track.artist;
    copy.append(name, artist);

    row.append(image, copy);
    row.addEventListener("click", () => selectTrack(index, true));
    trackList.append(row);
  });
  updateActiveRow();
}

function updateQueueDurations() {
  const known = tracks.filter((track) => durations.has(track.file));
  if (queueCount) {
    const total = known.reduce((sum, track) => sum + (durations.get(track.file) || 0), 0);
    queueCount.textContent = known.length === tracks.length && tracks.length
      ? `${tracks.length} tracks · ${formatTime(total)}`
      : `${tracks.length} tracks`;
  }
  if (!queueList) return;
  queueList.querySelectorAll(".mp-queue-row").forEach((row, index) => {
    const node = row.querySelector(".mp-queue-duration");
    const track = tracks[index];
    if (!node || !track) return;
    node.textContent = durations.has(track.file) ? formatTime(durations.get(track.file) || 0) : "--:--";
  });
}

function buildQueueList() {
  if (!queueList) return;
  const previousScroll = queueList.scrollTop;
  queueList.textContent = "";
  tracks.forEach((track, index) => {
    const row = document.createElement("div");
    row.className = "mp-queue-row";
    row.dataset.index = String(index);
    row.style.setProperty("--queue-index", String(index));
    row.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);

    const grip = document.createElement("span");
    grip.className = "mp-queue-grip";
    grip.innerHTML = ICONS.grip;
    grip.draggable = true;
    grip.tabIndex = 0;
    grip.title = "Drag to reorder";
    grip.setAttribute("role", "button");
    grip.setAttribute("aria-label", `Reorder ${track.title}`);

    const image = document.createElement("img");
    image.src = coverSource(track);
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => { image.onerror = null; image.src = placeholderCover(track); };

    const copy = document.createElement("span");
    copy.className = "mp-queue-copy";
    const name = document.createElement("strong");
    name.textContent = track.title;
    const artist = document.createElement("span");
    artist.textContent = track.artist;
    copy.append(name, artist);

    const now = document.createElement("span");
    now.className = "mp-queue-now";
    now.setAttribute("aria-hidden", "true");
    now.innerHTML = "<i></i><i></i><i></i>";

    const duration = document.createElement("span");
    duration.className = "mp-queue-duration";
    duration.textContent = durations.has(track.file) ? formatTime(durations.get(track.file) || 0) : "--:--";

    row.append(grip, image, copy, now, duration);
    row.addEventListener("click", () => {
      if (performance.now() < suppressQueueClickUntil) return;
      selectTrack(index, true);
    });
    grip.addEventListener("dragstart", (event) => {
      draggedIndex = index;
      queueDragging = true;
      clearQueueCloseTimer();
      queueList.classList.add("dragging");
      row.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      const ghost = createDragGhost(track);
      event.dataTransfer.setDragImage(ghost, 22, 23);
      window.setTimeout(() => ghost.remove(), 0);
    });
    grip.addEventListener("dragend", () => {
      clearDragMarks();
      draggedIndex = null;
      queueDragging = false;
      suppressQueueClickUntil = performance.now() + 250;
    });
    grip.addEventListener("keydown", (event) => {
      const focusGrip = (target) => {
        const rows = queueList.querySelectorAll(".mp-queue-row");
        const row = rows[target];
        if (row) row.querySelector(".mp-queue-grip")?.focus();
      };
      if (event.key === "ArrowUp" && index > 0) {
        event.preventDefault();
        reorderTrack(index, index - 1);
        focusGrip(index - 1);
      } else if (event.key === "ArrowDown" && index < tracks.length - 1) {
        event.preventDefault();
        reorderTrack(index, index + 2);
        focusGrip(index + 1);
      }
    });
    row.addEventListener("dragover", (event) => {
      if (!queueDragging) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const listRect = queueList.getBoundingClientRect();
      if (event.clientY < listRect.top + 32) queueList.scrollTop -= 12;
      else if (event.clientY > listRect.bottom - 32) queueList.scrollTop += 12;
      const rect = row.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      clearDropMarks();
      row.classList.add(before ? "drop-before" : "drop-after");
    });
    row.addEventListener("dragleave", clearDropMarks);
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      const from = draggedIndex === null ? Number(event.dataTransfer.getData("text/plain")) : draggedIndex;
      const target = Number(row.dataset.index);
      const insertion = row.classList.contains("drop-before") ? target : target + 1;
      clearDragMarks();
      draggedIndex = null;
      queueDragging = false;
      suppressQueueClickUntil = performance.now() + 250;
      reorderTrack(from, insertion);
    });
    queueList.append(row);
  });
  queueList.scrollTop = previousScroll;
  updateQueueDurations();
  updateActiveRow();
}

async function loadDurations() {
  await Promise.all(tracks.map((track) => new Promise((resolve) => {
    if (durations.has(track.file)) {
      resolve();
      return;
    }
    const probe = new Audio();
    probe.preload = "metadata";
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      durations.set(track.file, value);
      updateQueueDurations();
      probe.removeAttribute("src");
      resolve();
    };
    probe.addEventListener("loadedmetadata", () => finish(Number.isFinite(probe.duration) ? probe.duration : 0), { once: true });
    probe.addEventListener("error", () => finish(0), { once: true });
    probe.src = `${AUDIO_BASE}${track.file}`;
    probe.load();
    window.setTimeout(() => finish(0), 5000);
  })));
}

function initialTrackIndex(firstVisit) {
  if (firstVisit) {
    const index = tracks.findIndex((track) => track.file === FIRST_TRACK_FILE);
    return index >= 0 ? index : 0;
  }
  return Math.floor(Math.random() * tracks.length);
}

async function loadTracks() {
  const firstVisit = isFirstVisit();
  markVisited();
  try {
    const response = await fetch(`${AUDIO_BASE}tracks.json`, { cache: "no-store" });
    if (!response.ok) throw new Error("Track list unavailable");
    const data = await response.json();
    tracks = Array.isArray(data.tracks) ? data.tracks : [];
    if (!tracks.length) throw new Error("No tracks available");
    shuffleOrder();
    restoreMode();
    buildTrackList();
    buildQueueList();
    selectTrack(initialTrackIndex(firstVisit), false);
    updateVolumeVisual();
    syncArtSpan();
    requestAnimationFrame(() => {
      syncArtSpan();
      if (player) player.classList.add("art-ready");
    });
  } catch (_) {
    if (titleNode) titleNode.textContent = "Soundtrack unavailable";
    if (artistNode) artistNode.textContent = "Track list could not be loaded";
  }
}

function clearVolumeCloseTimer() {
  if (volumeCloseTimer !== null) {
    window.clearTimeout(volumeCloseTimer);
    volumeCloseTimer = null;
  }
}

function openVolumePopup(force = false) {
  clearVolumeCloseTimer();
  if (!force) closeQueuePopup(true);
  if (volumePopup) {
    volumePopup.classList.add("open");
    volumePopup.setAttribute("aria-hidden", "false");
  }
  if (volumeToggle) volumeToggle.setAttribute("aria-expanded", "true");
}

function closeVolumePopup(force = false) {
  if (volumePinned && !force) return;
  if (volumePopup) {
    volumePopup.classList.remove("open");
    volumePopup.setAttribute("aria-hidden", "true");
  }
  if (volumeToggle) volumeToggle.setAttribute("aria-expanded", "false");
}

function scheduleVolumeClose() {
  clearVolumeCloseTimer();
  volumeCloseTimer = window.setTimeout(() => closeVolumePopup(), 320);
}

function clearQueueCloseTimer() {
  if (queueCloseTimer !== null) {
    window.clearTimeout(queueCloseTimer);
    queueCloseTimer = null;
  }
}

function artQueueMask(width, height) {
  if (!width || !height) return "none";
  const r = Math.min(32, width / 2, height / 2);
  const path = `M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r} V ${height} H 0 V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${path}" fill="#fff"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function syncArtSpan() {
  if (!player) return;
  const playerRect = player.getBoundingClientRect();
  const barHeight = playerRect.height || 64;
  const maxQueueHeight = Math.min(468, Math.max(0, window.innerHeight - 108));
  const headroom = 48;
  const open = Boolean(queuePopup && queuePopup.classList.contains("open"));
  player.classList.toggle("queue-open", open);
  const queueWidth = open && queuePopup ? queuePopup.offsetWidth : 0;
  const queueHeight = open && queuePopup ? queuePopup.offsetHeight : 0;
  const queueRight = parseFloat(getComputedStyle(player).getPropertyValue("--queue-right")) || 18;
  const span = barHeight + maxQueueHeight + headroom;
  const queueX = queueWidth ? playerRect.width - queueRight - queueWidth : 0;
  const queueY = queueHeight ? span - barHeight - queueHeight : 0;

  player.style.setProperty("--art-bar-height", `${barHeight}px`);
  player.style.setProperty("--art-bar-y", `${span - barHeight}px`);
  player.style.setProperty("--art-span", `${span}px`);
  player.style.setProperty("--art-queue-w", `${queueWidth}px`);
  player.style.setProperty("--art-queue-h", `${queueHeight}px`);
  player.style.setProperty("--art-queue-x", `${queueX}px`);
  player.style.setProperty("--art-queue-y", `${queueY}px`);
  player.style.setProperty("--art-queue-mask", artQueueMask(queueWidth, queueHeight));
}

if (typeof ResizeObserver !== "undefined" && queuePopup) {
  new ResizeObserver(() => syncArtSpan()).observe(queuePopup);
}

function openQueuePopup(force = false) {
  clearQueueCloseTimer();
  if (!force) closeVolumePopup(true);
  buildQueueList();
  if (queuePopup) {
    queuePopup.classList.add("open");
    queuePopup.setAttribute("aria-hidden", "false");
  }
  if (queueButton) queueButton.setAttribute("aria-expanded", "true");
  syncArtSpan();
  loadDurations().then(syncArtSpan);
}

function closeQueuePopup(force = false) {
  if (queuePinned && !force) return;
  if (queuePopup) {
    queuePopup.classList.remove("open");
    queuePopup.setAttribute("aria-hidden", "true");
  }
  if (queueButton) queueButton.setAttribute("aria-expanded", "false");
  syncArtSpan();
}

function levelFromPointer(event) {
  if (!volumeTrack) return audio.volume;
  const rect = volumeTrack.getBoundingClientRect();
  if (!rect.height) return audio.volume;
  return (rect.bottom - event.clientY) / rect.height;
}

function startVolumeDrag(event) {
  if (event.button !== 0) return;
  cancelFade();
  event.preventDefault();
  event.stopPropagation();
  volumePinned = true;
  openVolumePopup(true);
  setVolume(levelFromPointer(event));

  const move = (moveEvent) => setVolume(levelFromPointer(moveEvent));
  const stop = () => {
    volumePinned = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    scheduleVolumeClose();
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

updatePlayIcon();
updateModeIcon();
setIcon(previousButton, "previous", "Previous track");
setIcon(nextButton, "next", "Next track");
setIcon(queueButton, "queue", "Open queue");
updateVolumeVisual();

if (queueList) {
  queueList.addEventListener("dragover", (event) => {
    if (!queueDragging || event.target !== queueList) return;
    event.preventDefault();
    clearDropMarks();
    const last = queueList.querySelector(".mp-queue-row:last-child");
    if (last) last.classList.add("drop-after");
  });
  queueList.addEventListener("dragleave", (event) => {
    const rect = queueList.getBoundingClientRect();
    if (event.clientX <= rect.left || event.clientX >= rect.right || event.clientY <= rect.top || event.clientY >= rect.bottom) {
      clearDropMarks();
    }
  });
  queueList.addEventListener("drop", (event) => {
    if (event.target !== queueList || draggedIndex === null) return;
    event.preventDefault();
    const from = draggedIndex;
    clearDragMarks();
    draggedIndex = null;
    queueDragging = false;
    suppressQueueClickUntil = performance.now() + 250;
    reorderTrack(from, tracks.length);
  });
}

if (playButton) playButton.addEventListener("click", togglePlay);
if (previousButton) previousButton.addEventListener("click", () => selectTrack(nextIndex(-1), true));
if (nextButton) nextButton.addEventListener("click", () => selectTrack(nextIndex(1), true));

if (modeButton) {
  modeButton.addEventListener("click", () => {
    playbackMode = playbackMode === "shuffle" ? "loop" : "shuffle";
    updateModeIcon();
    rememberMode();
  });
}

window.addEventListener("zr:profile", restoreMode);

if (seekInput) {
  const applySeek = () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = (Number(seekInput.value) / 100) * audio.duration;
    updateSeekVisual();
  };

  seekInput.addEventListener("pointerdown", () => {
    seeking = true;
    resumeAfterSeek = !audio.paused && !audio.ended;
    audio.pause();
  });

  seekInput.addEventListener("input", () => {
    const value = Number(seekInput.value);
    setProgress(value);
    if (!seeking) applySeek();
  });

  const finishSeek = () => {
    if (!seeking) return;
    seeking = false;
    applySeek();
    if (resumeAfterSeek) playAudio();
  };

  seekInput.addEventListener("pointerup", finishSeek);
  seekInput.addEventListener("pointercancel", finishSeek);
  seekInput.addEventListener("lostpointercapture", finishSeek);
  seekInput.addEventListener("change", () => {
    if (!seeking) applySeek();
  });
}

if (volumeWrap) {
  volumeWrap.addEventListener("pointerenter", () => openVolumePopup(true));
  volumeWrap.addEventListener("pointerleave", scheduleVolumeClose);
}

if (volumePopup) {
  volumePopup.addEventListener("wheel", (event) => {
    cancelFade();
    event.preventDefault();
    setVolume(audio.volume + (event.deltaY < 0 ? 0.04 : -0.04));
  }, { passive: false });
}

if (volumeTrack) {
  volumeTrack.addEventListener("pointerdown", startVolumeDrag);
  volumeTrack.addEventListener("keydown", (event) => {
    cancelFade();
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      setVolume(audio.volume + 0.05);
    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      setVolume(audio.volume - 0.05);
    } else if (event.key === "Home") {
      event.preventDefault();
      setVolume(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setVolume(1);
    }
  });
}

if (popupMuteButton) popupMuteButton.addEventListener("click", () => {
  cancelFade();
  toggleMute();
});
if (likeButton) {
  likeButton.addEventListener("click", () => {
    const track = tracks[currentIndex];
    if (!track) return;
    const key = `zr_soundtrack_like_${track.file}`;
    const liked = readStorage(key) === "1";
    writeStorage(key, liked ? "0" : "1");
    updateLikeButton(track);
  });
}

if (queueButton) {
  queueButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = Boolean(queuePopup && queuePopup.classList.contains("open"));
    if (open) {
      queuePinned = false;
      closeQueuePopup(true);
    } else {
      queuePinned = true;
      openQueuePopup(true);
    }
  });
  queueButton.onpointerenter = null;
  queueButton.onpointerleave = null;
  if (queuePopup) {
    queuePopup.onpointerenter = null;
    queuePopup.onpointerleave = null;
  }
}

audio.addEventListener("play", updatePlayIcon);
audio.addEventListener("pause", updatePlayIcon);
audio.addEventListener("ended", handleEnded);
audio.addEventListener("timeupdate", updateSeekVisual);
audio.addEventListener("loadedmetadata", updateSeekVisual);
audio.addEventListener("volumechange", updateVolumeVisual);

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : "";
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(activeTag)) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  } else if (event.code === "ArrowLeft") {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  } else if (event.code === "ArrowRight") {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  }
});

document.addEventListener("pointerdown", (event) => {
  if (queuePopup && queuePopup.classList.contains("open") && !queueDragging && !queuePopup.contains(event.target) && !queueButton.contains(event.target)) closeQueuePopup(true);
  if (volumePopup && volumePopup.classList.contains("open") && !volumePinned && !volumePopup.contains(event.target) && !volumeToggle.contains(event.target)) closeVolumePopup(true);
});

if (player) player.classList.add("ready");
audio.volume = 0;
audio.muted = true;
audio.defaultMuted = true;
updateVolumeVisual();
syncArtSpan();
loadTracks();

window.addEventListener("resize", syncArtSpan);
