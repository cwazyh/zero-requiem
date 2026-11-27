const BASE = window.ZR_API_BASE || "";
const discordButton = document.getElementById("discord-button");
const verifyButton = document.getElementById("verify-button");
const status = document.getElementById("verify-status");

verifyButton.href = `${BASE}/auth/login`;

async function loadPublicConfig() {
  try {
    const response = await fetch(`${BASE}/api/public-config`, { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    if (data.invite_url) {
      discordButton.href = data.invite_url;
      discordButton.removeAttribute("aria-disabled");
    }
  } catch (_) {
    status.textContent = "Invite configuration is currently unavailable.";
  }
}

async function loadSession() {
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

loadPublicConfig();
loadSession();
