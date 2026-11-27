const DEFAULT_API_BASE = "https://electronic-reaction-tips-hosted.trycloudflare.com";
const params = new URLSearchParams(window.location.search);
const requestedBase = params.get("api");
const storedBase = localStorage.getItem("zr_api_base");

if (requestedBase) {
  localStorage.setItem("zr_api_base", requestedBase.replace(/\/$/, ""));
}

window.ZR_API_BASE = (
  requestedBase ||
  storedBase ||
  window.ZR_API_BASE ||
  DEFAULT_API_BASE
).replace(/\/$/, "");
