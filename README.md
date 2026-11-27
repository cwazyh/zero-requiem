# Zero://Requiem Web Portal & Mod Panel

Feature #8: a standalone web portal with a Discord OAuth2 login and a role-gated moderation panel. It is intentionally separate from the Discord bot (`arthur-bot.service`); no working bot module was modified.

## Layout

- `docs/` — static frontend, publishable to GitHub Pages. Contains Home, Mod Panel, assets, and `.nojekyll`.
- `backend/` — Starlette service that owns OAuth2 secrets, sessions, role checks, and read-only bot data views.
- `.env` — local secrets, already populated from the existing Discord bot `.env` on the VM and the local GitHub token note. This file is gitignored and mode `600`.
- `.env.example` — template with empty values.
- `requirements.txt` — Python dependencies for the backend.

## What is already configured

The following values were found and consolidated into `.env` without printing or committing them:

- Discord OAuth client ID, client secret, application ID, public key, bot token, and guild ID from the bot VM `.env`.
- A GitHub token from the local `Zero Requiem/.env/github-classic-token.md` note.
- Owner role ID `1575826666041770046` and Mod role ID `1575630074865127434`.
- A generated `SESSION_SECRET`.
- `DISCORD_REDIRECT_URI=http://localhost:8000/auth/callback` for local development.

`DISCORD_INVITE_URL` is set to `https://discord.gg/zkfc4kJHUV` for the Join Discord button.

## GitHub Pages deployment

The static site in `docs/` is published to the project repository `cwazyh/zero-requiem`, so Home lives at `https://cwazyh.github.io/zero-requiem/`. GitHub usernames cannot be renamed to `Zero://Requiem`, but the project path keeps the server name visible in the address bar. A custom domain such as `zerorequiem.com` would be needed for a bare branded host. The repository contains only static files: no secrets, no Python backend, and no `.env`. The duplicate `cwazyh.github.io` repository was removed, leaving `cwazyh/zero-requiem` as the single GitHub Pages source.

The frontend uses image assets from both the server and the bot:

- `assets/logo.png` and `assets/banner.png` — Zero://Requiem server identity.
- `assets/arthur-logo.png` and `assets/arthur-banner.gif` — Arthur bot identity.
- `assets/roles/*.png` — the nine self-role element icons.

The Home page also introduces Arthur and lists its rules, self roles, leveling, private VCs, tickets, case files, logs, server stats, and honeypot features.

GitHub Pages cannot run the OAuth token exchange or keep a client secret private. The browser talks to the separately hosted Starlette backend. The backend runs on the Google Cloud VM behind a Cloudflare quick tunnel:

`https://electronic-reaction-tips-hosted.trycloudflare.com`

`config.js` defaults to that origin and also accepts `?api=https://your-backend.example` to override it. The chosen value is stored in `localStorage` under `zr_api_base`. Clear that key or pass another `?api=` value to switch backends. A tunnel URL changes when the tunnel service restarts, so update the default and the Discord Redirect URI together.

Signed-in users get a profile card with avatar, Discord name, handle, ID, and the real status dot from bot-side snapshots. Hovering or clicking that card opens a Discord-style user popout with a server-banner header, large avatar, status, a short ID, and local mute/deafen/settings controls. Clicking the logo opens a left sidebar with navigation and the profile card at the bottom. Until the account is signed in with an allowed role, the Mod Panel buttons act as Verify buttons and the Verify button moves into the sidebar; once access is granted, only then do the Mod Panel buttons link to the Mod Panel. The Join Discord button is hidden for accounts already in the server.

## Redirect URI setup

Add the exact Redirect URI of the **backend** in the Discord Developer Portal → OAuth2 → Redirects.

- Current tunnel backend: `https://electronic-reaction-tips-hosted.trycloudflare.com/auth/callback`
- Local: `http://localhost:8000/auth/callback`
- Production backend on the root domain: `https://zerorequiem.com/auth/callback`
- Production backend behind `/api`: `https://zerorequiem.com/api/auth/callback`
- Production backend on a subdomain: `https://api.zerorequiem.com/auth/callback`

Important: `https://cwazyh.github.io/zero-requiem/auth/callback` is not used. GitHub Pages is static and cannot exchange the authorization code or keep `DISCORD_CLIENT_SECRET` private. The client secret is never sent to the browser.

The backend redirects back to `FRONTEND_BASE_URL`, which is set to `https://cwazyh.github.io/zero-requiem`. `SESSION_COOKIE_SAMESITE=none` and CORS for that exact origin are already configured for cross-site login.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Open `http://localhost:8000/` for Home and `http://localhost:8000/mod` for the Mod Panel.

## GitHub Pages / custom domain

- Publish the `docs/` folder on the `main` branch of `cwazyh/zero-requiem` with GitHub Pages, or point a custom domain to the backend if you want a single origin. The repository root mirrors that published frontend and is the only Pages source.
- With a custom domain on the backend, configure TLS and set `PUBLIC_BASE_URL`, `FRONTEND_BASE_URL`, and `DISCORD_REDIRECT_URI` to the public HTTPS URLs.
- Keep `.env` outside the repository history. `.gitignore` already excludes it.

## API endpoints

Public:

- `GET /api/public-config` — invite URL and guild ID.
- `GET /api/me` — session status.
- `GET /auth/login`, `GET /auth/callback`, `GET /auth/logout` — OAuth2 flow.

Role-gated (Owner or Mod role):

- `GET /api/overview` — deploy state, counters, optional guild counts.
- `GET /api/cases?query=` — case files by user ID or transcript text.
- `GET /api/logs?category=` — tickets, cases, and deploy events.
- `GET /api/transcripts` — recent transcript files.
- `GET /api/config` — safe configuration view.

Moderation, message, server, and voice logs are not exposed by the bot data layer yet, so those feed categories show an empty state instead of stale data.

## Tests

```bash
.venv/bin/python -m unittest discover -s tests -q
```

## Soundtrack

The static site ships ten local MP3 files under `docs/assets/music/`. The pinned bar keeps the Linear desktop player metrics: 64px rounded container, 38px rounded cover, 16px title with 12px artist, centred transport buttons around a 34px circular play/pause, and compact right-side controls aligned 18px from the bar edge to match the cover's left inset. The controls are transparent, hug their icons, and appear in this order: random/loop mode, volume, a thin separator, then the Lucide-style queue button. Clicking the mode toggle swaps between the random icon and the loop icon; the choice is remembered per signed-in account. Its base material is the vendored `amazing-glass` web component (`<ag-glass variant="lens">`) with a fully transparent tint, high rounding, lens-style thickness, a narrow specular rim and near-zero frost/rainbow. There is no separate visible seek line or thumb: the whole bar is the timeline and the click target. While dragging it, playback pauses immediately and resumes from the released position, so seeking never produces the crackling sound of a live stream being cut. Above the glass sits a fully opaque cover-derived three-stop gradient whose left edge follows the bar's rounding; the right edge stays straight until the track ends, when the corners become fully round. The gradient slides through its colors as the track plays. At any point the played portion is solid color and the remaining portion stays transparent glass. With monochrome fallback artwork the gradient stays close to the site background; real covers tint it from their sampled palette. The volume popup is dark to match the theme, centred on its button, and opens or closes on click only. The queue popup is the same dark material, sits flush with the top edge of the bar, and lists each track with grip handle, cover, title, artist, and duration. It also opens and closes only on click, and stays open while a track is being reordered. Rows animate in cleanly, and dragging a grip draws an insertion line between the two tracks it will land between instead of highlighting a row. A heart button saves a track locally.

Every page open starts with a cyber uplink intro: an animated grid, a frosted `ag-glass` lens behind the logo, rotating rings, scan sweep, stepped glitch bursts applied to every text element, the rail glyphs, both logo images and a `ZR // NODE 01 // ENCRYPTED SESSION` readout below the access button, and a full-height rail that reaches the bottom of the viewport. The glitch stays idle most of the time and fires short, independent bursts: each text element, rail glyph and logo image runs on its own duration and negative offset, so they never pulse together; it uses offset clip-path slices and site-default slate/silver chromatic shadows only, with no extra colors such as purple or green anywhere in the intro. The sequence runs for about 3.2 seconds before a cryptic `// ACCESS THE SITE →` button unlocks. That click is the user gesture browsers require for audible playback. Music then starts from 0% and fades smoothly to the default 70% over eight seconds; the volume popup shows the same stable percentage, and manual volume changes cancel the fade. On the very first visit in a browser, `COLORS` always starts. Every later visit picks one of all ten tracks uniformly (10% each), and the whole queue is reshuffled on every page load.

Track metadata lives in `docs/assets/music/tracks.json`. Cover images belong in `docs/assets/music/covers/`; set each track's `cover` field to the image filename. Until covers are supplied, the player falls back to `assets/logo.png`.

Keyboard shortcuts: `Space` toggles playback, `ArrowLeft` and `ArrowRight` seek by five seconds, and the volume popup supports `ArrowUp`/`ArrowDown`, `Home`, `End`, and the mouse wheel. Shortcuts are ignored while typing in a form field.

## Security notes

- `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `GITHUB_TOKEN`, and `SESSION_SECRET` stay server-side.
- OAuth state is stored in the session and checked on callback.
- Access requires guild membership plus at least one configured staff role.
- All UI text, API responses, logs, and documentation are in English.
