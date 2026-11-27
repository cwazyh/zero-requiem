const BASE = window.ZR_API_BASE || "";
const FALLBACK_INVITE = "https://discord.gg/zkfc4kJHUV";
const discordButton = document.getElementById("discord-button");
const verifyButton = document.getElementById("verify-button");
const modButton = document.getElementById("mod-panel-button");
const sidebarModLink = document.getElementById("sidebar-mod-link");
const status = document.getElementById("verify-status");
const brandMenu = document.getElementById("brand-menu");
const sidebar = document.getElementById("sidebar");
const sidebarScrim = document.getElementById("sidebar-scrim");
const sidebarClose = document.getElementById("sidebar-close");
const verifySlot = document.getElementById("sidebar-verify-slot");
const profileAvatar = document.getElementById("profile-avatar");
const profileName = document.getElementById("profile-name");
const profileHandle = document.getElementById("profile-handle");
const profileStatus = document.getElementById("profile-status");
const statusDot = document.getElementById("profile-status-dot");

let lastVerifiedProfile = null;

function loginHref() {
  return BASE ? `${BASE}/auth/login` : FALLBACK_INVITE;
}

discordButton.href = FALLBACK_INVITE;
verifyButton.href = loginHref();
modButton.href = loginHref();
sidebarModLink.href = loginHref();

function openSidebar() {
  sidebar.classList.add("open");
  sidebar.setAttribute("aria-hidden", "false");
  brandMenu.setAttribute("aria-expanded", "true");
  sidebarScrim.hidden = false;
  requestAnimationFrame(() => sidebarScrim.classList.add("visible"));
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebar.setAttribute("aria-hidden", "true");
  brandMenu.setAttribute("aria-expanded", "false");
  sidebarScrim.classList.remove("visible");
  setTimeout(() => {
    if (!sidebar.classList.contains("open")) sidebarScrim.hidden = true;
  }, 280);
}

brandMenu.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarScrim.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSidebar();
});
sidebar.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", closeSidebar);
});

function applyProfile(me) {
  if (!me || !me.authenticated) {
    lastVerifiedProfile = null;
    profileAvatar.src = "assets/logo.png";
    profileName.textContent = "Not signed in";
    profileHandle.textContent = "Sign in with Discord to see your profile";
    profileStatus.textContent = "";
    statusDot.style.background = "#80848e";
    return;
  }

  lastVerifiedProfile = me;
  if (me.avatar_url) profileAvatar.src = me.avatar_url;
  profileAvatar.onerror = () => { profileAvatar.src = "assets/logo.png"; };
  profileName.textContent = me.display_name || me.username || "Discord user";
  profileHandle.textContent = me.handle ? `@${me.handle} • ${me.id}` : me.id;
  const custom = me.custom_status ? ` — ${me.custom_status}` : "";
  profileStatus.textContent = `${me.status_label || "Offline"}${custom}`;
  statusDot.style.background = me.status_color || "#80848e";
}

function applyAccess(me) {
  const authenticated = Boolean(me && me.authenticated);
  const allowed = authenticated && Boolean(me.allowed);
  const member = authenticated && Boolean(me.member);

  discordButton.hidden = member;
  verifyButton.hidden = allowed;

  if (allowed) {
    modButton.textContent = "Mod Panel";
    modButton.href = "mod.html";
    sidebarModLink.textContent = "Mod Panel";
    sidebarModLink.href = "mod.html";
    verifySlot.replaceChildren();
    return;
  }

  const label = authenticated ? "Verify — Staff role required" : "Verify with Discord";
  modButton.textContent = label;
  modButton.href = loginHref();
  sidebarModLink.textContent = label;
  sidebarModLink.href = loginHref();

  if (verifySlot.firstElementChild !== verifyButton) verifySlot.appendChild(verifyButton);
  verifyButton.textContent = label;
  verifyButton.href = loginHref();
}

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
  if (!BASE) {
    applyProfile(null);
    applyAccess(null);
    status.textContent = "Web verification needs the OAuth backend. For now, join Discord and accept the rules in #rules.";
    return;
  }

  try {
    const response = await fetch(`${BASE}/api/me`, { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json();
    applyProfile(data);
    applyAccess(data);
    if (data.authenticated) {
      status.textContent = data.allowed
        ? `Signed in as ${data.display_name || data.username}. Mod Panel access is available.`
        : `Signed in as ${data.display_name || data.username}. Staff role required for the Mod Panel.`;
    } else {
      status.textContent = "Verify with Discord to unlock the server and see your profile here.";
    }
  } catch (_) {
    if (!lastVerifiedProfile) {
      applyProfile(null);
      applyAccess(null);
    }
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

loadPublicConfig();
loadSession();
document.documentElement.classList.add("js");
setupRevealAnimations();
