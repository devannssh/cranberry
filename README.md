# CRANBERRY. — a 160-character journal
```
npm install
npm run dev      # http://localhost:5173
npm run build
```
Data lives in localStorage (`journal.entries.v2`) behind `src/lib/storage.js` — swap that file for a backend later. Sample entries are seeded on first load (clear the key to reseed).
One folder per month in a sideways shelf (swipe, trackpad, click-and-drag, mouse wheel, ←/→, or the month dots under it). Click a folder to step inside; dots under the stack jump between entries.
The shelf is an inset window with faded edges (`.shelfwrap` in `styles.css`: `--edge` = side margin, `max-width` = widest it gets).

**Scroll sounds** — every folder and every entry card ticks as it passes. Synthesised in `src/lib/tick.js` (Web Audio, no audio files): slow scrolling = deeper, rounder "tok"; fast = brighter, shorter "tic". Toggle with SOUND in the header (remembered in localStorage). Browsers only allow sound after a click / tap / key press, so the first wheel-scroll on a fresh page load is silent.
**Shelf feel** — knobs at the top of `src/components/Shelf.jsx`: `GLIDE_MS` (weight of a wheel / arrow / dot step), `DRAG_LAG` (how far the shelf trails your cursor while dragging), `COAST_MS` (friction after you let go).
Keys: Esc closes composer/folder · ←/→ browse folders, or switch months inside one · ↑/↓ move through entries · Cmd/Ctrl+Enter saves.
