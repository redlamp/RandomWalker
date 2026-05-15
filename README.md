# RandomWalker

3D "drunkard's walk" visualization. Originally a 2008-era Flash piece, ported to HTML5 Canvas in 2015, now rebuilt on Next.js + React + Three.js (via React Three Fiber).

N walkers spawn at the origin of a bounded 3D lattice and step in random cardinal directions (6-axis: ±x, ±y, ±z), with two rules:

1. No immediate reverse — can't undo the previous step.
2. Stay inside the bounding cube.

When a walker returns to the origin it retires; its trail flips to a highlighted color and starts glowing through bloom.

## Stack

- Bun (runtime + package manager)
- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind v4 + shadcn/ui (base-ui under the hood)
- Three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- Zustand for sim state

## Run

```sh
bun install
bun run dev
```

Then open <http://localhost:3000>.

```sh
bun run build   # production build
bun run start   # serve production build
bun run lint
```

## Legacy

The original 2015 single-file Canvas implementation lives in [`legacy/`](./legacy). It is preserved unchanged as a reference for the visual style.
