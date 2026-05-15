# RandomWalker — Initial Report

Initial review of the repo on revival, 2026-05-15.

## Concept

"Drunkard's Walk." N walkers start at canvas center. Each step picks a random cardinal direction with two rules: no immediate reverse, must stay in bounds. The path is drawn live. When a walker returns to origin, its route is redrawn highlighted and the walker retires.

## Stack

Plain HTML5 Canvas + vanilla JS. No build, no dependencies, no modules, no tests. A single `index.html` + a single `walker.js`.

## History

12 commits total. Initial submission 2015-11-03 (port from an older Flash piece). Dormant ~10 years. Last commit 2026-04-06 "Back at it" — only renamed `walker.htm` → `index.html` and added `.gitignore`. No modernization work yet.

## Files

| File | Notes |
|------|-------|
| `index.html` | 19 lines. Inline `onclick`, hardcoded 640×640 canvas, body-level `<script>WalkerMain()</script>` runs after `walker.js` loads. |
| `walker.js` | 262 lines. Single global scope. Functions: `WalkerMain`, `draw`, `createWalkers`, `playToggle`, constructors `Walker`, `Step`, `Point`, direction constants, `configFPS`. |
| `README.md` | 4 lines. |
| `.gitignore` | Windows cruft only. |

## Code smells / modernization targets

- **Globals everywhere.** `this.x` at function top binds to `window`. `walkers`, `activeWalkers`, `ctx`, `c`, `play`, `stepDistance`, `startX/Y`, `fps` all live on `window`. `walker = new Walker(i)` in `createWalkers` leaks too (no `var`).
- **No `let`/`const`/modules/classes.** ES5-era patterns: `function Walker(id)` + `Walker.prototype.foo`. `Step` is a factory returning an object literal — inconsistent with the rest.
- `Walker.prototype.beginDraw(active)` takes an `active` arg and ignores it.
- **Implicit global:** `var xBeg = xEnd = ...` in `drawStep` leaks `xEnd` to `window`.
- **FPS counter uses `new Date()` per frame** and resets each second — `performance.now()` would be cleaner.
- **No HiDPI handling** — blurry on retina displays.
- **No controls** beyond play/pause. No reset, no walker count, no speed, no color, no seed.
- **Corner-trap edge case:** if a walker has no legal direction, `dirs` is empty and `dir` becomes `undefined`, crashing `last.point.clone().add(dir)`. Possible at canvas edges depending on `stepDistance`.

## Modernization options

1. **Minimal refresh** — wrap in IIFE/module, `const`/`let`, `class Walker`, fix implicit globals, HiDPI canvas, `performance.now()` FPS. ~1 afternoon.
2. **Interactive overhaul** — add UI controls (walker count, step size, colors, reset, seed), proper layout with CSS, responsive canvas. ~1 day.
3. **Full rebuild** — Vite + TS, `OffscreenCanvas` worker for sim, decouple sim from render, dat.gui or shadcn controls, export PNG, share-link via query params. Multi-day.

Recommended path: **#1 + #2 incremental** — keep the single-file ethos but make it solid and tweakable.
