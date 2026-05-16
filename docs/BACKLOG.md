# Backlog

Items intentionally deferred from the live audit.

## Accessibility

- **`prefers-reduced-motion` support** (review item #1). Gate auto-orbit default + bloom shimmer + GSAP transitions on `window.matchMedia("(prefers-reduced-motion: reduce)").matches`. Add an in-app override toggle in the Camera panel so a user can opt back in. Listen for `change` events on the MediaQueryList so toggling the OS setting takes effect without a refresh.
- WCAG AA contrast pass on `--muted-foreground` against `--card` in dark theme.
- Categorical / colorblind-safe palette presets for active vs retired walkers.
- Replace native `<input type="color">` with a shadcn popover + `react-colorful` for a larger hit target and consistent focus ring.
- Replace `+`/`−` collapse glyphs with lucide chevrons.
- `aria-label="3D random walker visualization"` on `<main>`; add a hidden text summary of current stats for screen readers.
- Slider scroll-wheel adjustment on focused thumb.

## Usability

- Keyboard shortcuts: Space → play/pause, R → reset, D → dice, C → collapse main panel.
- URL hash state (seed + key config) so runs are shareable.
- Auto-disable the "Retired" visibility option until `retiredCount > 0`; add empty-state overlay when the active group is hidden and the retired group is empty.
- "done" badge state when all walkers retire (sim is idle, not "live").

## Performance

- Merge retired walker geometries into a single `LineSegments` per generation via `BufferGeometryUtils` to drop draw-call count.
- Remove retired walker refs from `linesRef.current` after retire so the per-frame `flushPositions` loop doesn't visit frozen entries.
- "Quality" preset (off / low / high) gating bloom kernel size + postprocessing.
- Swap MSAA (`antialias: true`) for FXAA from `postprocessing` to free up the MSAA framebuffer at retina DPRs.
- Dispose previous `BoxGeometry` / `EdgesGeometry` in `BoundingCube` when size changes.

## Design

- Custom favicon (single-walker glyph).
- Drop redundant "Random Walker · 3D" footer text or repurpose for a keybinding hint.
- Audit dark palette: `--primary` and `--secondary` currently both map to the same red — variants are indistinguishable.
- Tighten bloom `luminanceThreshold` so retired trails pop instead of hazing.
