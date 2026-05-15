# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RandomWalker — a 3D "drunkard's walk" visualization. Modernized port of an older HTML5 Canvas piece (preserved in `legacy/`). N walkers spawn at the origin of a bounded 3D lattice and step in random cardinal directions (6 axes), forbidden from immediately reversing and bounded inside a cube. When a walker returns to origin it retires; its trail switches material (brighter color, additive blending) and glows through bloom postprocessing.

## Stack

- **Bun** as both runtime and package manager. Use `bun install`, `bun add`, `bun run`. Don't introduce npm/pnpm/yarn lockfiles.
- **Next.js 16** (App Router, Turbopack). See `AGENTS.md` — this is a newer Next.js whose APIs may not match your training. Note `ssr: false` on `next/dynamic` is not allowed in Server Components in Next 16; either mark the parent as a client component or import the component directly (it's already `"use client"`).
- **React 19** + **TypeScript** strict mode.
- **Tailwind v4** + **shadcn/ui**. The generated shadcn components in `src/components/ui/` use **base-ui** under the hood (`@base-ui/react`), not Radix. Slider `value`/`onValueChange` types are `number | readonly number[]`, not the Radix `number[]` — `src/components/control-panel.tsx` has a `toScalar` helper for this.
- **Three.js** via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`. `postprocessing` itself is a peer (used for `KernelSize`).
- **Zustand** for the sim store (`src/store/sim-store.ts`).

## Commands

```sh
bun install          # install deps
bun run dev          # next dev (Turbopack) on :3000
bun run build        # production build
bun run start        # serve production build
bun run lint         # eslint
bunx tsc --noEmit    # typecheck only
```

No test runner is configured.

## Architecture

The sim is split cleanly into a **pure TypeScript core** and an **imperative R3F renderer**.

- `src/lib/walker.ts` — framework-free. Owns:
  - `DIRS` — 6 cardinal unit vectors. Pairs are arranged so the reverse of index `i` is `i ^ 1` (used by `Walker.step` to forbid immediate reverse).
  - `mulberry32(seed)` — seeded RNG so a given seed reproduces a run.
  - `Walker` — `steps: Vec3[]` in lattice coordinates (origin always `[0,0,0]`), `lastDir`, `active`. `step(rng, bound)` filters legal directions, picks uniformly, appends, sets `active = false` on return to origin or when no legal direction exists.
  - `World` — owns `active[]` + `retired[]`. `tick()` iterates `active` descending so splicing retired walkers into `retired[]` doesn't shift indices.

- `src/store/sim-store.ts` — Zustand store with `SimConfig` (walkerCount, bound, stepSize, seed, speed, playing, showBoundingCube, bloomIntensity), `SimStats`, plus `generation` (incremented by `reset()` to force a rebuild). Components subscribe to scalar slices to avoid re-render storms.

- `src/components/scene/RandomWalkerScene.tsx` — top-level R3F `<Canvas>`. Adds camera, OrbitControls, lights, optional `<BoundingCube>`, `<WalkerSim>`, and an `EffectComposer` with `Bloom`.

- `src/components/scene/WalkerSim.tsx` — owns the world + per-walker line geometries. Pattern:
  - `useMemo` builds `World` + a `WalkerLineRef[]` (one preallocated `Float32Array(MAX_STEPS * 3)`-backed `THREE.Line` per walker). Rebuilds when `generation`, `walkerCount`, `bound`, or `seed` change.
  - `useFrame` accumulates `delta * 60 * speed` into `frameAccum`, ticks the world that many times per frame (capped at 8 to avoid hangs), and for each tick writes the new step into the walker's position attribute + bumps `drawRange`. On retire, swaps the line material color/opacity.
  - Pushes stats back to the store via `setStats`. **Sim updates happen in `useFrame`, not React state** — only stats round-trip through React.
  - `MAX_STEPS = 16384`. Walkers that exceed it are flagged `capped` and frozen (rare, but possible on long bounded walks).

- `src/components/control-panel.tsx` — overlay UI built from shadcn primitives, reads + writes the store.

## Conventions

- **Preserve the aesthetic of the original**: active walker trails are translucent and accumulate; retired walkers re-paint in a brighter color with additive blending. Don't clear the canvas per frame — the build-up is the visualization. (The R3F renderer mimics this via per-walker materials, not by skipping `clear` — three handles framebuffer clearing automatically.)
- **`useFrame` is the sim loop.** Don't drive ticks from React state or `setInterval`.
- **Subscribe to scalar slices** of the Zustand store (`useSimStore((s) => s.foo)`), never the whole store inside `useFrame`-adjacent components.
- **Imperative geometry mutation** for hot paths. Re-creating `BufferGeometry` per frame is the wrong shape; mutate the attribute + flip `needsUpdate`.
- **Seeded RNG** is intentional — share-link / replay is a future feature. Don't reintroduce `Math.random()` inside the sim.

## Legacy

`legacy/index.html` + `legacy/walker.js` are the unmodified 2015 Canvas implementation. Don't edit them — they're a reference. The original is 2D; the new app generalizes to 3D.

## Known follow-ups

- No tests yet.
- Share-link via URL query params (seed + config) — not wired.
- PNG export, walker history scrubber, alt geometries (sphere / torus bounds) — open ideas.
