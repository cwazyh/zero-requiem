const AUDIO_BASE = "assets/music/";
const FALLBACK_COVER = "assets/logo.png";
const REPEAT_MODES = ["off", "all", "one"];

const audio = document.getElementById("mp-audio");
const player = document.getElementById("music-player");
const cover = document.getElementById("mp-cover");
const titleNode = document.getElementById("mp-title");
const artistNode = document.getElementById("mp-artist");
const playButton = document.getElementById("mp-play");
const prevButton = document.getElementById("mp-prev");
const nextButton = document.getElementById("mp-next");
const shuffleButton = document.getElementById("mp-shuffle");
const repeatButton = document.getElementById("mp-repeat");
const seekInput = document.getElementById("mp-seek");
const currentNode = document.getElementById("mp-current");
const durationNode = document.getElementById("mp-duration");
const volumeInput = document.getElementById("mp-volume");
const muteButton = document.getElementById("mp-mute");
const trackList = document.getElementById("track-list");

let tracks = [];
let currentIndex = 0;
let shuffle = false;
let repeatModeIndex = 0;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function coverSource(track) {
  return track.cover ? `${AUDIO_BASE}covers/${track.cover}` : FALLBACK_COVER;
}

function updatePlayIcon() {
  const playing = !audio.paused && !audio.ended;
  playButton.textContent = playing ? "❚❚" : "▶";
  playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
}

function updateActiveRow() {
  if (!trackList) return;
  trackList.querySelectorAll(".track-row").forEach((row, index) => {
    row.classList.toggle("active", index === currentIndex);
  });
}

function setProgress() {
  const duration = audio.duration;
  const value = Number.isFinite(duration) && duration > 0
    ? (audio.currentTime / duration) * 100
    : 0;
  seekInput.value = String(value);
  currentNode.textContent = formatTime(audio.currentTime);
  durationNode.textContent = formatTime(duration);
}

function playAudio() {
  const result = audio.play();
  if (result && typeof result.catch === "function") {
    result.catch(() => {
      playButton.textContent = "▶";
    });
  }
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
  updateActiveRow();
  setProgress();
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
  if (REPEAT_MODES[repeatModeIndex] === "one") {
    audio.currentTime = 0;
    playAudio();
    return;
  }
  if (currentIndex === tracks.length - 1 && REPEAT_MODES[repeatModeIndex] === "off") {
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

async function loadTracks() {
  try {
    const response = await fetch(`${AUDIO_BASE}tracks.json`, { cache: "no-store" });
    if (!response.ok) throw new Error("Track list unavailable");
    const data = await response.json();
    tracks = Array.isArray(data.tracks) ? data.tracks : [];
    if (!tracks.length) throw new Error("No tracks available");
    buildTrackList();
    selectTrack(0, false);
  } catch (_) {
    if (titleNode) titleNode.textContent = "Soundtrack unavailable";
    if (artistNode) artistNode.textContent = "Track list could not be loaded";
  }
}

playButton.addEventListener("click", togglePlay);
prevButton.addEventListener("click", () => selectTrack(nextIndex(-1), true));
nextButton.addEventListener("click", () => selectTrack(nextIndex(1), true));

shuffleButton.addEventListener("click", () => {
  shuffle = !shuffle;
  shuffleButton.classList.toggle("active", shuffle);
  shuffleButton.setAttribute("aria-label", shuffle ? "Shuffle on" : "Shuffle off");
});

repeatButton.addEventListener("click", () => {
  repeatModeIndex = (repeatModeIndex + 1) % REPEAT_MODES.length;
  const mode = REPEAT_MODES[repeatModeIndex];
  repeatButton.classList.toggle("active", mode !== "off");
  repeatButton.textContent = mode === "one" ? "↻1" : "↻";
  repeatButton.setAttribute("aria-label", `Repeat ${mode}`);
});

seekInput.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration)) return;
  audio.currentTime = (Number(seekInput.value) / 100) * audio.duration;
});

volumeInput.addEventListener("input", () => {
  audio.volume = Number(volumeInput.value);
  audio.muted = false;
  muteButton.textContent = "🔊";
});

muteButton.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteButton.textContent = audio.muted ? "🔇" : "🔊";
});

audio.addEventListener("play", updatePlayIcon);
audio.addEventListener("pause", updatePlayIcon);
audio.addEventListener("ended", handleEnded);
audio.addEventListener("timeupdate", setProgress);
audio.addEventListener("loadedmetadata", setProgress);

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : "";
  if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  } else if (event.code === "ArrowLeft") {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  } else if (event.code === "ArrowRight") {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  }
});

if (player) player.classList.add("ready");
audio.volume = Number(volumeInput.value);
loadTracks();
