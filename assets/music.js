const AUDIO_BASE = "assets/music/";
const FALLBACK_COVER = "assets/logo.png";
const REPEAT_MODES = ["off", "all", "one"];
const PLAYBACK_RATES = [1, 1.25, 1.5, 2];
const VISIT_KEY = "zr_soundtrack_visited_v1";
const FIRST_TRACK_FILE = "colors-flow.mp3";
const DEFAULT_VOLUME = 0.8;

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
  speed: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM10 8v8l6-4-6-4z"/></svg>',
  open: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5h5V3H3v7h2V5zm9-2v2h5v5h2V3h-7zm5 14v5h-5v2h7v-7h-2zM3 14v7h7v-2H5v-5H3z"/></svg>',
  queue: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6h11v2H4V6zm0 5h11v2H4v-2zm0 5h7v2H4v-2zm13-9v10.5a3.5 3.5 0 1 0 2 3.16V10h3V7h-5z"/></svg>',
};

const audio = document.getElementById("mp-audio");
const player = document.getElementById("music-player");
const cover = document.getElementById("mp-cover");
const titleNode = document.getElementById("mp-title");
const artistNode = document.getElementById("mp-artist");
const playButton = document.getElementById("mp-play");
const previousButton = document.getElementById("mp-prev");
const nextButton = document.getElementById("mp-next");
const shuffleButton = document.getElementById("mp-shuffle");
const repeatButton = document.getElementById("mp-repeat");
const speedButton = document.getElementById("mp-speed");
const seekInput = document.getElementById("mp-seek");
const currentNode = document.getElementById("mp-current");
const durationNode = document.getElementById("mp-duration");
const volumeToggle = document.getElementById("mp-volume");
const volumePopup = document.getElementById("mp-volume-popup");
const volumeTrack = document.getElementById("mp-volume-track");
const volumeFill = document.getElementById("mp-volume-fill");
const volumePercent = document.getElementById("mp-volume-percent");
const popupMuteButton = document.getElementById("mp-popup-mute");
const unmuteButton = document.getElementById("mp-unmute");
const likeButton = document.getElementById("mp-like");
const openButton = document.getElementById("mp-open");
const queueButton = document.getElementById("mp-queue");
const trackList = document.getElementById("track-list");

let tracks = [];
let currentIndex = 0;
let shuffle = false;
let repeatModeIndex = 0;
let rateIndex = 0;
let lastVolume = DEFAULT_VOLUME;
let autoplayBlocked = true;
let volumePinned = false;
let volumeCloseTimer = null;

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

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function coverSource(track) {
  return track.cover ? `${AUDIO_BASE}covers/${track.cover}` : FALLBACK_COVER;
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

function updateShuffleIcon() {
  setIcon(shuffleButton, "shuffle", shuffle ? "Shuffle on" : "Shuffle off");
  shuffleButton.classList.toggle("active", shuffle);
}

function updateRepeatIcon() {
  const mode = REPEAT_MODES[repeatModeIndex];
  repeatButton.innerHTML = `${ICONS.repeat}${mode === "one" ? '<span class="mp-one">1</span>' : ""}`;
  repeatButton.classList.toggle("active", mode !== "off");
  repeatButton.setAttribute("aria-label", `Repeat ${mode}`);
  repeatButton.title = `Repeat ${mode}`;
}

function updateVolumeIcons() {
  const muted = audio.muted || audio.volume === 0;
  const icon = muted ? "mute" : "volume";
  setIcon(volumeToggle, icon, muted ? "Unmute" : "Volume");
  setIcon(popupMuteButton, icon, muted ? "Unmute" : "Mute");
  if (unmuteButton) unmuteButton.hidden = !autoplayBlocked;
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
  if (!trackList) return;
  trackList.querySelectorAll(".track-row").forEach((row, index) => {
    row.classList.toggle("active", index === currentIndex);
  });
}

function updateSeekVisual() {
  const duration = audio.duration;
  const value = Number.isFinite(duration) && duration > 0
    ? (audio.currentTime / duration) * 100
    : 0;
  seekInput.value = String(value);
  seekInput.style.setProperty("--progress", `${value}%`);
  currentNode.textContent = formatTime(audio.currentTime);
  durationNode.textContent = formatTime(duration);
}

function updateSpeedIcon() {
  const rate = PLAYBACK_RATES[rateIndex];
  setIcon(speedButton, "speed", `Playback speed ${rate}x`);
  speedButton.title = `Playback speed: ${rate}x`;
}

function startAutoplay() {
  audio.muted = true;
  autoplayBlocked = true;
  updateVolumeVisual();

  const attempt = () => {
    const result = audio.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  };

  if (audio.readyState >= 2) attempt();
  else audio.addEventListener("canplay", attempt, { once: true });
}

async function playAudio() {
  try {
    await audio.play();
    autoplayBlocked = false;
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
  updateVolumeVisual();
  updatePlayIcon();
}

function togglePlay() {
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
  cover.onerror = () => { cover.src = FALLBACK_COVER; };
  cover.src = coverSource(track);
  updateLikeButton(track);
  updateActiveRow();
  updateSeekVisual();
  if (autoplay) playAudio();
}

function nextIndex(direction) {
  if (shuffle && tracks.length > 1) {
    let candidate = currentIndex;
    while (candidate === currentIndex) {
      candidate = Math.floor(Math.random() * tracks.length);
    }
    return candidate;
  }
  return (currentIndex + direction + tracks.length) % tracks.length;
}

function handleEnded() {
  const mode = REPEAT_MODES[repeatModeIndex];
  if (mode === "one") {
    audio.currentTime = 0;
    playAudio();
    return;
  }
  if (currentIndex === tracks.length - 1 && mode === "off") {
    updatePlayIcon();
    return;
  }
  selectTrack(nextIndex(1), true);
}

function buildTrackList() {
  if (!trackList) return;
  trackList.textContent = "";
  tracks.forEach((track, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "track-row";
    row.setAttribute("aria-label", `Play ${track.title} by ${track.artist}`);

    const image = document.createElement("img");
    image.src = coverSource(track);
    image.alt = "";
    image.loading = "lazy";
    image.onerror = () => { image.src = FALLBACK_COVER; };

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

function initialTrackIndex() {
  if (isFirstVisit()) {
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
    shuffle = !firstVisit;
    updateShuffleIcon();
    buildTrackList();
    selectTrack(initialTrackIndex(), false);
    startAutoplay();
  } catch (_) {
    if (titleNode) titleNode.textContent = "Soundtrack unavailable";
    if (artistNode) artistNode.textContent = "Track list could not be loaded";
  }
}

function enableSound() {
  audio.muted = false;
  autoplayBlocked = false;
  if (unmuteButton) unmuteButton.hidden = true;
  updateVolumeVisual();
  if (audio.paused) playAudio();
}

function clearVolumeCloseTimer() {
  if (volumeCloseTimer !== null) {
    window.clearTimeout(volumeCloseTimer);
    volumeCloseTimer = null;
  }
}

function openVolumePopup() {
  clearVolumeCloseTimer();
  if (volumePopup) volumePopup.hidden = false;
  if (volumeToggle) volumeToggle.setAttribute("aria-expanded", "true");
}

function closeVolumePopup() {
  if (volumePinned) return;
  if (volumePopup) volumePopup.hidden = true;
  if (volumeToggle) volumeToggle.setAttribute("aria-expanded", "false");
}

function scheduleVolumeClose() {
  clearVolumeCloseTimer();
  volumeCloseTimer = window.setTimeout(closeVolumePopup, 320);
}

function levelFromPointer(event) {
  if (!volumeTrack) return audio.volume;
  const rect = volumeTrack.getBoundingClientRect();
  if (!rect.height) return audio.volume;
  return (rect.bottom - event.clientY) / rect.height;
}

function startVolumeDrag(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  volumePinned = true;
  openVolumePopup();
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

function scrollToSoundtrack() {
  const target = document.getElementById("soundtrack");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToQueue() {
  const target = document.getElementById("track-list");
  if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
}

updatePlayIcon();
updateShuffleIcon();
updateRepeatIcon();
updateSpeedIcon();
updateVolumeVisual();

if (playButton) playButton.addEventListener("click", togglePlay);
if (previousButton) previousButton.addEventListener("click", () => selectTrack(nextIndex(-1), true));
if (nextButton) nextButton.addEventListener("click", () => selectTrack(nextIndex(1), true));

if (shuffleButton) {
  shuffleButton.addEventListener("click", () => {
    shuffle = !shuffle;
    updateShuffleIcon();
  });
}

if (repeatButton) {
  repeatButton.addEventListener("click", () => {
    repeatModeIndex = (repeatModeIndex + 1) % REPEAT_MODES.length;
    updateRepeatIcon();
  });
}

if (speedButton) {
  speedButton.addEventListener("click", () => {
    rateIndex = (rateIndex + 1) % PLAYBACK_RATES.length;
    audio.playbackRate = PLAYBACK_RATES[rateIndex];
    updateSpeedIcon();
  });
}

if (seekInput) {
  seekInput.addEventListener("input", () => {
    if (!Number.isFinite(audio.duration)) return;
    audio.currentTime = (Number(seekInput.value) / 100) * audio.duration;
    updateSeekVisual();
  });
}

if (volumeToggle) {
  volumeToggle.addEventListener("click", () => {
    if (volumePopup && !volumePopup.hidden && volumePinned) {
      volumePinned = false;
      closeVolumePopup();
    } else {
      volumePinned = true;
      openVolumePopup();
    }
  });
  volumeToggle.addEventListener("pointerenter", openVolumePopup);
  volumeToggle.addEventListener("pointerleave", scheduleVolumeClose);
}

if (volumePopup) {
  volumePopup.addEventListener("pointerenter", openVolumePopup);
  volumePopup.addEventListener("pointerleave", scheduleVolumeClose);
  volumePopup.addEventListener("wheel", (event) => {
    event.preventDefault();
    setVolume(audio.volume + (event.deltaY < 0 ? 0.04 : -0.04));
  }, { passive: false });
}

if (volumeTrack) {
  volumeTrack.addEventListener("pointerdown", startVolumeDrag);
  volumeTrack.addEventListener("keydown", (event) => {
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

if (popupMuteButton) popupMuteButton.addEventListener("click", toggleMute);
if (unmuteButton) unmuteButton.addEventListener("click", enableSound);

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

if (openButton) openButton.addEventListener("click", scrollToSoundtrack);
if (queueButton) {
  if (!trackList) queueButton.hidden = true;
  else queueButton.addEventListener("click", scrollToQueue);
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

document.addEventListener("pointerdown", () => {
  if (autoplayBlocked) enableSound();
});

if (player) player.classList.add("ready");
audio.volume = DEFAULT_VOLUME;
audio.muted = true;
updateVolumeVisual();
loadTracks();
