const BASE = window.ZR_API_BASE || "";
const FALLBACK_INVITE = "https://discord.gg/zkfc4kJHUV";
const panel = document.getElementById("panel");
const denied = document.getElementById("denied");
const userInfo = document.getElementById("user-info");
const deniedDetail = document.getElementById("denied-detail");

document.querySelectorAll('a[href="/auth/logout"]').forEach((link) => {
  if (BASE) link.href = `${BASE}/auth/logout`;
  else link.remove();
});
document.querySelectorAll('a[href="/auth/login"]').forEach((link) => {
  link.href = BASE ? `${BASE}/auth/login` : FALLBACK_INVITE;
  if (!BASE) link.textContent = "Open Discord";
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

async function api(path) {
  const response = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function applyProfile(me) {
  const avatar = document.getElementById("profile-avatar");
  const name = document.getElementById("profile-name");
  const handle = document.getElementById("profile-handle");
  const presence = document.getElementById("profile-status");
  const dot = document.getElementById("profile-status-dot");
  if (!avatar || !name || !handle || !presence || !dot) return;
  if (!me || !me.authenticated) {
    avatar.src = "assets/logo.png";
    name.textContent = "Not signed in";
    handle.textContent = "Sign in with Discord to see your profile";
    presence.textContent = "";
    dot.style.background = "#80848e";
    return;
  }
  if (me.avatar_url) avatar.src = me.avatar_url;
  avatar.onerror = () => { avatar.src = "assets/logo.png"; };
  name.textContent = me.display_name || me.username || "Discord user";
  handle.textContent = me.handle ? `@${me.handle} • ${me.id}` : me.id;
  const custom = me.custom_status ? ` — ${me.custom_status}` : "";
  presence.textContent = `${me.status_label || "Offline"}${custom}`;
  dot.style.background = me.status_color || "#80848e";
}

function timestamp(value) {
  if (!value) return "unknown";
  return new Date(value * 1000).toLocaleString();
}

function showDenied(message) {
  panel.style.display = "none";
  denied.style.display = "block";
  if (message) deniedDetail.textContent = message;
}

async function loadSession() {
  if (!BASE) {
    applyProfile(null);
    userInfo.textContent = "OAuth backend is not connected.";
    showDenied("Web sign-in needs the OAuth backend. Staff tools are available inside Discord for now.");
    return;
  }
  try {
    const me = await api("/api/me");
    applyProfile(me);
    if (!me.authenticated) {
      showDenied("You need to sign in with Discord before opening the Mod Panel.");
      return;
    }
    userInfo.innerHTML = `<strong>${escapeHtml(me.username)}</strong> <span class="badge ${me.allowed ? "ok" : "deny"}">${me.allowed ? "Authorized staff" : "Missing staff role"}</span> <code>${escapeHtml(me.id)}</code>`;
    if (!me.allowed || !me.member) {
      showDenied(me.member ? "Your Discord account is verified, but it does not hold an authorized staff role." : "Your Discord account is not a member of Zero://Requiem.");
      return;
    }
    denied.style.display = "none";
    panel.style.display = "block";
    loadOverview();
    loadCases();
    loadLogs();
    loadConfig();
  } catch (_) {
    showDenied("Session verification is unavailable. Try again in a moment.");
  }
}

async function loadOverview() {
  try {
    const data = await api("/api/overview");
    const counts = data.counts;
    document.getElementById("metrics").innerHTML = [
      ["Open tickets", counts.open_tickets],
      ["Case files", counts.case_files],
      ["Active members", counts.active_members],
      ["Private channels", counts.private_channels],
      [data.guild.available ? "Guild members" : "Guild pulse", data.guild.available ? data.guild.members : "unavailable"],
      [data.guild.available ? "Online now" : "Status", data.guild.available ? data.guild.online : "unavailable"],
    ].map(([label, value]) => `<article class="card"><h3>${escapeHtml(label)}</h3><div class="metric">${escapeHtml(value)}</div></article>`).join("");

    const deploy = data.deploy;
    document.getElementById("deploy-info").innerHTML = [
      ["Service", deploy.service],
      ["Build", deploy.build],
      ["Counter", `v${deploy.counter}`],
      ["Deployed at", timestamp(deploy.timestamp)],
      ["Changes", deploy.changes || "No changes recorded."],
      ["Viewer roles", (data.viewer.roles || []).join(", ") || "none"],
    ].map(([key, value]) => `<span>${escapeHtml(key)}</span><span>${escapeHtml(value)}</span>`).join("");
  } catch (_) {
    document.getElementById("metrics").innerHTML = '<div class="empty error">Overview data is unavailable.</div>';
  }
}

async function loadCases(query = "") {
  try {
    const data = await api(`/api/cases?query=${encodeURIComponent(query)}&limit=50`);
    const body = document.getElementById("cases-body");
    body.innerHTML = data.items.length
      ? data.items.map((item) => `<tr><td>${item.case_number ? `#${escapeHtml(item.case_number)}` : "—"}</td><td><code>${escapeHtml(item.user_id)}</code></td><td>${timestamp(item.opened_at)}</td><td>${escapeHtml(item.context || "—")}</td></tr>`).join("")
      : '<tr><td colspan="4" class="empty">No matching case files.</td></tr>';
  } catch (_) {
    document.getElementById("cases-body").innerHTML = '<tr><td colspan="4" class="empty error">Case data is unavailable.</td></tr>';
  }
}

async function loadLogs() {
  const category = document.getElementById("log-category").value;
  try {
    const data = await api(`/api/logs?category=${encodeURIComponent(category)}&limit=50`);
    const body = document.getElementById("logs-body");
    body.innerHTML = data.items.length
      ? data.items.map((item) => `<tr><td>${timestamp(item.timestamp)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail || "—")}</td></tr>`).join("")
      : '<tr><td colspan="4" class="empty">No events available for this filter.</td></tr>';
  } catch (_) {
    document.getElementById("logs-body").innerHTML = '<tr><td colspan="4" class="empty error">Log data is unavailable.</td></tr>';
  }
}

async function loadConfig() {
  try {
    const data = await api("/api/config");
    const rows = [
      ["Guild ID", data.guild_id],
      ["Allowed roles", data.mod_role_ids.join(", ")],
      ["Redirect URI", data.redirect_uri],
      ["Public URL", data.public_base_url],
      ["Frontend URL", data.frontend_base_url],
      ["Invite configured", data.invite_configured ? "yes" : "no"],
      ["Data root", data.data_root],
      ["Data root available", data.data_root_available ? "yes" : "no"],
      ["GitHub token configured", data.github_token_configured ? "yes" : "no"],
      ["OAuth scopes", data.oauth_scopes.join(" ")],
    ];
    document.getElementById("config-info").innerHTML = rows.map(([key, value]) => `<span>${escapeHtml(key)}</span><span>${escapeHtml(value)}</span>`).join("");
  } catch (_) {
    document.getElementById("config-info").innerHTML = '<div class="empty error">Configuration is unavailable.</div>';
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`view-${tab.dataset.view}`).classList.add("active");
  });
});

document.getElementById("case-search").addEventListener("click", () => {
  loadCases(document.getElementById("case-query").value.trim());
});
document.getElementById("case-query").addEventListener("keydown", (event) => {
  if (event.key === "Enter") loadCases(event.target.value.trim());
});
document.getElementById("log-category").addEventListener("change", loadLogs);

loadSession();
