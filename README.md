# DAILY. — a 160-character journal
```
npm install
npm run dev      # http://localhost:5173
npm run build
```
Data lives in localStorage (`journal.entries.v2`) behind `src/lib/storage.js` — swap that file for a backend later. Sample entries are seeded on first load (clear the key to reseed).
One folder per month in a sideways shelf (swipe, trackpad, mouse wheel or ←/→). Click a folder to step inside; dots under the stack jump between entries.
Keys: Esc closes composer/folder · ←/→ browse folders, or switch months inside one · ↑/↓ move through entries · Cmd/Ctrl+Enter saves.
