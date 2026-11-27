const BASE = window.ZR_API_BASE || "";
const FALLBACK_INVITE = "https://discord.gg/zkfc4kJHUV";
const discordButton = document.getElementById("discord-button");
const verifyButton = document.getElementById("verify-button");
const status = document.getElementById("verify-status");

discordButton.href = FALLBACK_INVITE;
discordButton.removeAttribute("aria-disabled");
verifyButton.href = BASE ? `${BASE}/auth/login` : FALLBACK_INVITE;

async function loadPublicConfig() {
  if (!BASE) return;
  try {
    const response = await fetch(`${BASE}/api/public-config`, { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.invite_url) discordButton.href = data.invite_url;
  } catch (_) {
    status.textContent = "Invite configuration is currently unavailable.";
  }
}

async function loadSession() {
  if (!BASE) return;
  try {
    const response = await fetch(`${BASE}/api/me`, { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.authenticated) {
      verifyButton.textContent = data.allowed ? "Verified — Staff" : "Verified — Member";
      status.textContent = data.allowed
        ? `Signed in as ${data.username}. Mod Panel access is available.`
        : `Signed in as ${data.username}. Staff role required for the Mod Panel.`;
    }
  } catch (_) {
    status.textContent = "Session status is currently unavailable.";
  }
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll(
    ".hero h1, .hero p, .actions, .notice, .section-head, .card, .banner, .bot-banner, .roles-strip figure"
  );
  targets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 45}ms`;
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((element) => observer.observe(element));
}

if (BASE) {
  loadPublicConfig();
  loadSession();
} else {
  status.textContent = "Web verification needs the OAuth backend. For now, join Discord and accept the rules in #rules.";
}

document.documentElement.classList.add("js");
setupRevealAnimations();
