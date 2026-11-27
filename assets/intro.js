const intro = document.getElementById("intro");
const accessButton = document.getElementById("intro-access");
const statusNode = document.getElementById("intro-status");
const progressFill = document.getElementById("intro-progress-fill");

const stages = [
  "HANDSHAKE // 00%",
  "DECRYPTING CHANNELS // 34%",
  "SYNCING PRESENCE // 68%",
  "AUDIO LINK STANDBY // 91%",
  "ACCESS READY // 100%",
];

const stageDuration = 700;

stages.forEach((text, index) => {
  window.setTimeout(() => {
    if (!statusNode) return;
    statusNode.textContent = text;
    statusNode.dataset.text = text;
  }, index * stageDuration);
});

window.setTimeout(() => {
  if (intro) intro.classList.add("ready");
  if (accessButton) accessButton.disabled = false;
}, stages.length * stageDuration + 400);

if (accessButton) {
  accessButton.addEventListener("click", () => {
    if (accessButton.disabled) return;
    if (intro) intro.classList.add("leaving");
    window.dispatchEvent(new CustomEvent("zr:access"));
    window.setTimeout(() => {
      if (intro) intro.remove();
    }, 700);
  });
}

if (progressFill) progressFill.classList.add("running");
