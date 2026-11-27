const PROFILE_FALLBACK_INVITE = "https://discord.gg/zkfc4kJHUV";

const PROFILE_ICONS = {
  mute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-7 9a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2a5 5 0 0 1-10 0H5z"/></svg>',
  muteOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.3 2 2 3.3l7 7V6a3 3 0 0 1 5.9-.7l1.5 1.5A3 3 0 0 1 15 12v2.2l1.9 1.9A7 7 0 0 0 19 12h-2a5 5 0 0 1-.7 2.5l1.5 1.5A7 7 0 0 0 19 12h2a7 7 0 0 1-6 6.92V21h-2v-2.08a7 7 0 0 1-2-.6L3.3 22 2 20.7 19.7 3z"/></svg>',
  deafen: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1v-8H5v-1a7 7 0 0 1 14 0v1h-2v8h1a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9z"/></svg>',
  deafenOff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3.3 3.3 2 22 20.7 20.7 22 17 18.3V20h-2v-8h2v-1a7 7 0 0 0-1.1-3.8L14 6.2V5a2 2 0 0 0-3.8-1L2 3.3zM5 12v1h2v5H5a3 3 0 0 1 3-3h1v-4H5zm8-3.6a7 7 0 0 1 6 6.9v1h-2v-1a5 5 0 0 0-4-4.9V8.4z"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.8 7.8 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3.5h-4L10.7 5a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.8 7.8 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.5 7.5 0 0 0 1.7 1L11 20.5h4l1.3-1.4a7.5 7.5 0 0 0 1.7-1l2.5 1 2-3.5L19.4 13zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
  caret: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z"/></svg>',
};

let popout = null;
let hideTimer = null;
let activeTrigger = null;
let muted = false;
let deafened = false;

function currentProfile() {
  return window.ZR_PROFILE || null;
}

function shortId(value) {
  if (!value) return "";
  return String(value).length > 18 ? `${String(value).slice(0, 18)}...` : String(value);
}

function loginHref() {
  return window.ZR_API_BASE ? `${window.ZR_API_BASE}/auth/login` : PROFILE_FALLBACK_INVITE;
}

function ensurePopout() {
  if (popout) return popout;

  popout = document.createElement("div");
  popout.className = "user-popout";
  popout.id = "user-popout";
  popout.setAttribute("role", "dialog");
  popout.setAttribute("aria-label", "User profile");
  popout.hidden = true;
  popout.innerHTML = `
    <div class="popout-banner" id="popout-banner"></div>
    <div class="popout-body">
      <div class="popout-avatar-wrap">
        <img id="popout-avatar" src="assets/logo.png" alt="">
        <span class="status-dot" id="popout-status-dot"></span>
      </div>
      <div class="popout-identity">
        <strong id="popout-name">Not signed in</strong>
        <span id="popout-handle">Sign in with Discord to see your profile</span>
        <span class="popout-status"><i id="popout-status-dot-small"></i><em id="popout-status"></em></span>
      </div>
      <div class="popout-divider"></div>
      <div class="popout-note">Zero://Requiem • Discord linked profile</div>
      <div class="popout-actions">
        <button id="popout-mute" type="button" aria-label="Toggle microphone" aria-pressed="false"></button>
        <span class="popout-caret">${PROFILE_ICONS.caret}</span>
        <button id="popout-deafen" type="button" aria-label="Toggle headphones" aria-pressed="false"></button>
        <span class="popout-caret">${PROFILE_ICONS.caret}</span>
        <button id="popout-settings" type="button" aria-label="Profile settings"></button>
      </div>
      <a class="popout-verify" id="popout-verify" href="${loginHref()}" target="_blank" rel="noopener noreferrer">Verify with Discord</a>
    </div>`;

  document.body.appendChild(popout);

  popout.addEventListener("mouseenter", cancelHide);
  popout.addEventListener("mouseleave", scheduleHide);
  popout.addEventListener("focusin", cancelHide);
  popout.addEventListener("focusout", scheduleHide);

  popout.querySelector("#popout-mute").addEventListener("click", () => {
    muted = !muted;
    syncActionButtons();
  });
  popout.querySelector("#popout-deafen").addEventListener("click", () => {
    deafened = !deafened;
    syncActionButtons();
  });
  popout.querySelector("#popout-settings").addEventListener("click", () => {
    if (window.location.pathname.endsWith("mod.html")) return;
    window.location.href = "mod.html";
  });

  syncActionButtons();
  return popout;
}

function cancelHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = null;
}

function scheduleHide() {
  cancelHide();
  hideTimer = setTimeout(hidePopout, 180);
}

function syncActionButtons() {
  if (!popout) return;
  const mute = popout.querySelector("#popout-mute");
  const deafen = popout.querySelector("#popout-deafen");
  const settings = popout.querySelector("#popout-settings");
  mute.innerHTML = muted ? PROFILE_ICONS.muteOff : PROFILE_ICONS.mute;
  mute.setAttribute("aria-pressed", String(muted));
  deafen.innerHTML = deafened ? PROFILE_ICONS.deafenOff : PROFILE_ICONS.deafen;
  deafen.setAttribute("aria-pressed", String(deafened));
  settings.innerHTML = PROFILE_ICONS.settings;
}

function renderProfile() {
  const panel = ensurePopout();
  const me = currentProfile();
  const avatar = panel.querySelector("#popout-avatar");
  const dot = panel.querySelector("#popout-status-dot");
  const dotSmall = panel.querySelector("#popout-status-dot-small");
  const statusText = panel.querySelector("#popout-status");
  const verify = panel.querySelector("#popout-verify");
  const accent = (me && me.status_color) || "#80848e";

  panel.style.setProperty("--popout-accent", accent);

  if (!me || !me.authenticated) {
    avatar.src = "assets/logo.png";
    avatar.onerror = null;
    dot.style.background = "#80848e";
    dotSmall.style.background = "#80848e";
    panel.querySelector("#popout-name").textContent = "Not signed in";
    panel.querySelector("#popout-handle").textContent = "Verify with Discord to load your profile";
    statusText.textContent = "Web verification required";
    verify.hidden = false;
    verify.href = loginHref();
    return;
  }

  avatar.onerror = () => { avatar.src = "assets/logo.png"; };
  avatar.src = me.avatar_url || "assets/logo.png";
  dot.style.background = accent;
  dotSmall.style.background = accent;
  panel.querySelector("#popout-name").textContent = me.display_name || me.guild_nick || me.username || "Discord user";
  const handle = me.handle || me.username || "unknown";
  panel.querySelector("#popout-handle").textContent = `@${handle} · ${shortId(me.id)}`;
  statusText.textContent = `${me.status_label || "Offline"}${me.custom_status ? ` — ${me.custom_status}` : ""}`;
  verify.hidden = true;
}

function showPopout(trigger) {
  cancelHide();
  activeTrigger = trigger;
  renderProfile();

  const panel = ensurePopout();
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("visible"));

  const rect = trigger.getBoundingClientRect();
  const width = panel.offsetWidth || 300;
  const height = panel.offsetHeight || 320;
  let left = rect.right + 12;
  if (left + width > window.innerWidth - 12) left = rect.left - width - 12;
  if (left < 12) left = Math.min(rect.left, window.innerWidth - width - 12);
  left = Math.max(12, left);

  let top = rect.top + rect.height / 2 - height / 2;
  top = Math.max(12, Math.min(top, window.innerHeight - height - 12));

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function hidePopout() {
  if (!popout) return;
  popout.classList.remove("visible");
  activeTrigger = null;
  setTimeout(() => {
    if (!popout.classList.contains("visible")) popout.hidden = true;
  }, 180);
}

document.querySelectorAll("[data-profile-trigger]").forEach((trigger) => {
  trigger.setAttribute("tabindex", "0");
  trigger.addEventListener("mouseenter", () => showPopout(trigger));
  trigger.addEventListener("mouseleave", scheduleHide);
  trigger.addEventListener("focus", () => showPopout(trigger));
  trigger.addEventListener("blur", scheduleHide);
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (activeTrigger === trigger && popout && !popout.hidden) hidePopout();
    else showPopout(trigger);
  });
});

document.addEventListener("click", (event) => {
  if (popout && !popout.hidden && !popout.contains(event.target)) hidePopout();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hidePopout();
});
