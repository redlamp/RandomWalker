"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "@/store/sim-store";
import { World, type Walker } from "@/lib/walker";

const MAX_STEPS = 16384;
const ACTIVE_COLOR = new THREE.Color("#ff80ff");
const RETIRED_PALETTE = [
  "#ff3df0",
  "#7d1bff",
  "#1bffd1",
  "#ff5e7d",
  "#ffae3b",
  "#5effff",
  "#a3ff5e",
];

interface WalkerLineRef {
  walker: Walker;
  geometry: THREE.BufferGeometry;
  positionAttr: THREE.BufferAttribute;
  material: THREE.LineBasicMaterial;
  line: THREE.Line;
  retired: boolean;
  capped: boolean;
}

function buildWorld(count: number, bound: number, seed: number): { world: World; refs: WalkerLineRef[] } {
  const w = new World({ count, bound, seed });
  const refs: WalkerLineRef[] = w.active.map((walker, idx) => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(MAX_STEPS * 3);
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geom.setAttribute("position", attr);
    geom.setDrawRange(0, 1);
    attr.setXYZ(0, 0, 0, 0);
    attr.needsUpdate = true;

    const mat = new THREE.LineBasicMaterial({
      color: ACTIVE_COLOR.clone(),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const line = new THREE.Line(geom, mat);
    line.frustumCulled = false;

    return {
      walker,
      geometry: geom,
      positionAttr: attr,
      material: mat,
      line,
      retired: false,
      capped: false,
    };
  });
  return { world: w, refs };
}

export function WalkerSim() {
  const generation = useSimStore((s) => s.generation);
  const walkerCount = useSimStore((s) => s.walkerCount);
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const seed = useSimStore((s) => s.seed);
  const speed = useSimStore((s) => s.speed);
  const playing = useSimStore((s) => s.playing);
  const setStats = useSimStore((s) => s.setStats);

  const worldRef = useRef<World | null>(null);
  const linesRef = useRef<WalkerLineRef[]>([]);
  const frameAccum = useRef(0);
  const longestRef = useRef(0);

  const built = useMemo(
    () => buildWorld(walkerCount, bound, seed),
    [generation, walkerCount, bound, seed],
  );

  useEffect(() => {
    worldRef.current = built.world;
    linesRef.current = built.refs;
    frameAccum.current = 0;
    longestRef.current = 0;
    setStats({
      activeCount: built.world.active.length,
      retiredCount: 0,
      totalSteps: built.world.active.length,
      longestRetiredSteps: 0,
    });
    const refs = built.refs;
    return () => {
      for (const r of refs) {
        r.geometry.dispose();
        r.material.dispose();
      }
    };
  }, [built, setStats]);

  useFrame((_, delta) => {
    if (!playing) return;
    const world = worldRef.current;
    const lines = linesRef.current;
    if (!world || lines.length === 0) return;

    frameAccum.current += delta * 60 * speed;
    let ticks = Math.floor(frameAccum.current);
    if (ticks <= 0) return;
    frameAccum.current -= ticks;
    ticks = Math.min(ticks, 8);

    for (let t = 0; t < ticks; t++) {
      world.tick();
      for (const l of lines) {
        if (l.retired || l.capped) continue;
        const stepIdx = l.walker.steps.length - 1;
        if (stepIdx >= MAX_STEPS) {
          l.capped = true;
          l.walker.active = false;
          continue;
        }
        const last = l.walker.steps[stepIdx];
        l.positionAttr.setXYZ(stepIdx, last[0] * stepSize, last[1] * stepSize, last[2] * stepSize);
        l.geometry.setDrawRange(0, stepIdx + 1);
        l.positionAttr.needsUpdate = true;

        if (!l.walker.active && !l.retired) {
          l.retired = true;
          const hex = RETIRED_PALETTE[l.walker.id % RETIRED_PALETTE.length];
          l.material.color.set(hex);
          l.material.opacity = 0.9;
          if (l.walker.steps.length > longestRef.current) {
            longestRef.current = l.walker.steps.length;
          }
        }
      }
    }

    let totalSteps = 0;
    for (const l of lines) totalSteps += l.walker.steps.length;
    setStats({
      activeCount: world.active.length,
      retiredCount: world.retired.length,
      totalSteps,
      longestRetiredSteps: longestRef.current,
    });
  });

  return (
    <group>
      {built.refs.map((r) => (
        <primitive key={r.walker.id} object={r.line} />
      ))}
    </group>
  );
}
