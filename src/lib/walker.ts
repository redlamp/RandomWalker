export type Vec3 = readonly [number, number, number];

export const DIRS: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Walker {
  readonly id: number;
  readonly steps: Vec3[];
  lastDir: number;
  active: boolean;

  constructor(id: number) {
    this.id = id;
    this.steps = [[0, 0, 0]];
    this.lastDir = -1;
    this.active = true;
  }

  step(rng: () => number, bound: number): void {
    if (!this.active) return;
    const last = this.steps[this.steps.length - 1];
    const legal: number[] = [];
    for (let i = 0; i < DIRS.length; i++) {
      if (this.lastDir !== -1 && (this.lastDir ^ 1) === i) continue;
      const d = DIRS[i];
      const nx = last[0] + d[0];
      const ny = last[1] + d[1];
      const nz = last[2] + d[2];
      if (Math.abs(nx) > bound || Math.abs(ny) > bound || Math.abs(nz) > bound) continue;
      legal.push(i);
    }
    if (legal.length === 0) {
      this.active = false;
      return;
    }
    const idx = legal[Math.floor(rng() * legal.length)];
    const d = DIRS[idx];
    const next: Vec3 = [last[0] + d[0], last[1] + d[1], last[2] + d[2]];
    this.steps.push(next);
    this.lastDir = idx;
    if (next[0] === 0 && next[1] === 0 && next[2] === 0) {
      this.active = false;
    }
  }
}

export interface WorldOptions {
  count: number;
  bound: number;
  seed: number;
}

export class World {
  active: Walker[];
  retired: Walker[];
  readonly bound: number;
  private readonly rng: () => number;
  tickCount: number;

  constructor(opts: WorldOptions) {
    this.bound = opts.bound;
    this.rng = mulberry32(opts.seed);
    this.active = Array.from({ length: opts.count }, (_, i) => new Walker(i));
    this.retired = [];
    this.tickCount = 0;
  }

  tick(): { newlyRetired: Walker[] } {
    const newlyRetired: Walker[] = [];
    for (let i = this.active.length - 1; i >= 0; i--) {
      const w = this.active[i];
      w.step(this.rng, this.bound);
      if (!w.active) {
        newlyRetired.push(w);
        this.retired.push(w);
        this.active.splice(i, 1);
      }
    }
    this.tickCount++;
    return { newlyRetired };
  }

  get done(): boolean {
    return this.active.length === 0;
  }
}
