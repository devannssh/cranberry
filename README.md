# cranberry. — a 160-character journal
```
npm install
cd server && npm install && cp .env.example .env   # set JWT_SECRET, point MONGODB_URI at your MongoDB
cd ..
npm run server   # API on http://localhost:4000
npm run dev      # http://localhost:5173 (proxies /api to the server)
npm run build    # then `cd server && npm start` serves the built app + API on one port
```
Data lives in MongoDB behind the Express server in `server/` (accounts + entries). `src/lib/storage.js` is the only file that talks to it. New accounts start empty; entries from the old localStorage version are copied into your account once, on first sign-in.
One folder per month in a sideways shelf (swipe, trackpad, click-and-drag, mouse wheel, ←/→, or the month dots under it). Click a folder to step inside; dots under the stack jump between entries.
The shelf is an inset window with faded edges (`.shelfwrap` in `styles.css`: `--edge` = side margin, `max-width` = widest it gets).

**Scroll sounds** — every folder and every entry card ticks as it passes. Synthesised in `src/lib/tick.js` (Web Audio, no audio files): slow scrolling = deeper, rounder "tok"; fast = brighter, shorter "tic". Toggle with SOUND in the header (remembered in localStorage). Browsers only allow sound after a click / tap / key press, so the first wheel-scroll on a fresh page load is silent.
**Shelf feel** — knobs at the top of `src/components/Shelf.jsx`: `GLIDE_MS` (weight of a wheel / arrow / dot step), `DRAG_LAG` (how far the shelf trails your cursor while dragging), `COAST_MS` (friction after you let go).
Keys: Esc closes composer/folder · ←/→ browse folders, or switch months inside one · ↑/↓ move through entries · Cmd/Ctrl+Enter saves.

**Backend** — see `server/`. Cookie-session auth (bcrypt + JWT in an httpOnly cookie), one entry per user per day (unique index on `user + date`).
`POST /api/auth/register|login|logout`, `GET /api/auth/me` · `GET /api/entries[?month=YYYY-MM]` · `PUT /api/entries/:date` (create or replace that day) · `PATCH|DELETE /api/entries/:id` · `POST /api/entries/import`. Set `ALLOW_REGISTRATION=false` once your account exists if it's a personal diary.

**Usernames & profile** — after the first sign-up you pick a unique `@username` (3–20 letters, numbers or `_`, checked live) and an avatar; it shows on every folder (`client: yourname`) and in the navbar, where it opens a menu with Profile and Sign out. The profile card has two looks, light and gradient, and the choice is saved on your account. API: `GET /api/auth/username-available?u=` and `PATCH /api/auth/me {username?, avatar?, profileStyle?}`.

**Motion** (GSAP, all skipped under `prefers-reduced-motion`; shared pieces live in `src/lib/fx.js`) — folder tiles assemble and "wake" as they cross the shelf centre (count-up, decoding labels, dot ripple, spinning chip) and float under the cursor; a date stamp with glyph confetti slams down when you save; a ticker under the shelf speeds up and leans with the scroll; the profile opens as a circle growing out of the navbar and its card morphs between the two looks; magnetic buttons, a hopping wordmark, a month label that decodes, a rattling text box at 160 characters.

The app is called **cranberry** now. The default MongoDB database is still named `daily` on purpose, so existing local data keeps working; point `MONGODB_URI` at a new name if you want a fresh one. Fonts: Bricolage Grotesque (display) and DM Mono (labels).
