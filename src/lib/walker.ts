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

export interface Segment {
  from: Vec3;
  to: Vec3;
}

export class Walker {
  readonly id: number;
  position: Vec3;
  lastDir: number;
  active: boolean;
  stepCount: number;

  constructor(id: number) {
    this.id = id;
    this.position = [0, 0, 0];
    this.lastDir = -1;
    this.active = true;
    this.stepCount = 0;
  }

  step(rng: () => number, bound: number): Segment | null {
    if (!this.active) return null;
    const last = this.position;
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
      return null;
    }
    const idx = legal[Math.floor(rng() * legal.length)];
    const d = DIRS[idx];
    const from: Vec3 = [last[0], last[1], last[2]];
    const next: Vec3 = [last[0] + d[0], last[1] + d[1], last[2] + d[2]];
    this.position = next;
    this.lastDir = idx;
    this.stepCount++;
    if (next[0] === 0 && next[1] === 0 && next[2] === 0) {
      this.active = false;
    }
    return { from, to: next };
  }
}

export interface WorldOptions {
  count: number;
  bound: number;
  seed: number;
}

export interface TickResult {
  segments: { walker: Walker; from: Vec3; to: Vec3 }[];
  newlyRetired: Walker[];
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

  tick(): TickResult {
    const newlyRetired: Walker[] = [];
    const segments: TickResult["segments"] = [];
    for (let i = this.active.length - 1; i >= 0; i--) {
      const w = this.active[i];
      const seg = w.step(this.rng, this.bound);
      if (seg) segments.push({ walker: w, from: seg.from, to: seg.to });
      if (!w.active) {
        newlyRetired.push(w);
        this.retired.push(w);
        this.active.splice(i, 1);
      }
    }
    this.tickCount++;
    return { segments, newlyRetired };
  }

  get done(): boolean {
    return this.active.length === 0;
  }
}
