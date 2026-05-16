"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { InstancedInterleavedBuffer, InterleavedBufferAttribute } from "three";
import { useSimStore, type BlendMode } from "@/store/sim-store";
import { World, type Walker } from "@/lib/walker";

const MAX_STEPS = 16384;
const MAX_SEGMENTS = MAX_STEPS - 1;

function blendingFor(mode: BlendMode): THREE.Blending {
  switch (mode) {
    case "additive":
      return THREE.AdditiveBlending;
    case "multiply":
      return THREE.MultiplyBlending;
    case "normal":
    default:
      return THREE.NormalBlending;
  }
}

interface WalkerLineRef {
  walker: Walker;
  geometry: LineGeometry;
  material: LineMaterial;
  line: Line2;
  buffer: Float32Array;
  interleaved: InstancedInterleavedBuffer;
  uploadedSegments: number;
  retired: boolean;
  capped: boolean;
}

function makeMaterial(width: number, opacity: number, blendMode: BlendMode) {
  const m = new LineMaterial({
    color: 0xffffff,
    linewidth: width,
    worldUnits: false,
    transparent: true,
    opacity,
    blending: blendingFor(blendMode),
    depthWrite: false,
    dashed: false,
  });
  if (typeof window !== "undefined") {
    m.resolution.set(window.innerWidth, window.innerHeight);
  } else {
    m.resolution.set(1024, 1024);
  }
  return m;
}

function applyColorAndGlow(
  material: LineMaterial,
  hex: string,
  glow: number,
  blendMode: BlendMode,
) {
  const c = new THREE.Color(hex);
  if (blendMode === "additive") {
    c.multiplyScalar(Math.max(0, glow));
  }
  material.color.copy(c);
}

function buildWorld(
  count: number,
  bound: number,
  seed: number,
  activeWidth: number,
  activeOpacity: number,
  activeColor: string,
  activeGlow: number,
  blendMode: BlendMode,
): { world: World; refs: WalkerLineRef[] } {
  const w = new World({ count, bound, seed });
  const refs: WalkerLineRef[] = w.active.map((walker) => {
    // Preallocated stride-6 buffer: per segment, [startX, startY, startZ, endX, endY, endZ].
    const buffer = new Float32Array(MAX_SEGMENTS * 6);
    const interleaved = new InstancedInterleavedBuffer(buffer, 6, 1);
    interleaved.setUsage(THREE.DynamicDrawUsage);

    const geom = new LineGeometry();
    geom.setAttribute("instanceStart", new InterleavedBufferAttribute(interleaved, 3, 0));
    geom.setAttribute("instanceEnd", new InterleavedBufferAttribute(interleaved, 3, 3));
    geom.instanceCount = 0;

    const mat = makeMaterial(activeWidth, activeOpacity, blendMode);
    applyColorAndGlow(mat, activeColor, activeGlow, blendMode);

    const line = new Line2(geom, mat);
    line.frustumCulled = false;

    return {
      walker,
      geometry: geom,
      material: mat,
      line,
      buffer,
      interleaved,
      uploadedSegments: 0,
      retired: false,
      capped: false,
    };
  });
  return { world: w, refs };
}

function flushPositions(l: WalkerLineRef, stepSize: number) {
  const stepsLen = Math.min(l.walker.steps.length, MAX_STEPS);
  const targetSegments = Math.max(0, stepsLen - 1);
  if (targetSegments === l.uploadedSegments) return;

  // If targetSegments < uploadedSegments (after a stepSize-driven reset), rebuild from zero.
  const startSeg = targetSegments < l.uploadedSegments ? 0 : l.uploadedSegments;
  for (let i = startSeg; i < targetSegments; i++) {
    const p0 = l.walker.steps[i];
    const p1 = l.walker.steps[i + 1];
    const off = i * 6;
    l.buffer[off] = p0[0] * stepSize;
    l.buffer[off + 1] = p0[1] * stepSize;
    l.buffer[off + 2] = p0[2] * stepSize;
    l.buffer[off + 3] = p1[0] * stepSize;
    l.buffer[off + 4] = p1[1] * stepSize;
    l.buffer[off + 5] = p1[2] * stepSize;
  }
  l.interleaved.needsUpdate = true;
  l.geometry.instanceCount = targetSegments;
  l.uploadedSegments = targetSegments;
}

export function WalkerSim() {
  const generation = useSimStore((s) => s.generation);
  const walkerCount = useSimStore((s) => s.walkerCount);
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const seed = useSimStore((s) => s.seed);
  const speed = useSimStore((s) => s.speed);
  const playing = useSimStore((s) => s.playing);
  const visibility = useSimStore((s) => s.visibility);
  const active = useSimStore((s) => s.active);
  const retired = useSimStore((s) => s.retired);
  const blendMode = useSimStore((s) => s.blendMode);
  const setStats = useSimStore((s) => s.setStats);

  const { size } = useThree();

  const worldRef = useRef<World | null>(null);
  const linesRef = useRef<WalkerLineRef[]>([]);
  const frameAccum = useRef(0);
  const longestRef = useRef(0);
  const activeGroupRef = useRef<THREE.Group>(null);
  const retiredGroupRef = useRef<THREE.Group>(null);
  const lastStatsAt = useRef(0);

  const built = useMemo(
    () =>
      buildWorld(
        walkerCount,
        bound,
        seed,
        active.width,
        active.opacity,
        active.color,
        active.glow,
        blendMode,
      ),
    // active.* + blendMode applied via separate effects so tweaks don't rebuild the world.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation, walkerCount, bound, seed],
  );

  useEffect(() => {
    worldRef.current = built.world;
    linesRef.current = built.refs;
    frameAccum.current = 0;
    longestRef.current = 0;
    lastStatsAt.current = 0;
    setStats({
      activeCount: built.world.active.length,
      retiredCount: 0,
      totalSteps: built.world.active.length,
      longestRetiredSteps: 0,
    });

    const activeGroup = activeGroupRef.current;
    const retiredGroup = retiredGroupRef.current;
    if (activeGroup) {
      while (activeGroup.children.length) activeGroup.remove(activeGroup.children[0]);
      for (const r of built.refs) activeGroup.add(r.line);
    }
    if (retiredGroup) {
      while (retiredGroup.children.length) retiredGroup.remove(retiredGroup.children[0]);
    }

    const refs = built.refs;
    return () => {
      for (const r of refs) {
        r.geometry.dispose();
        r.material.dispose();
      }
    };
  }, [built, setStats]);

  // keep LineMaterial resolution synced to canvas size
  useEffect(() => {
    for (const l of linesRef.current) {
      l.material.resolution.set(size.width || window.innerWidth, size.height || window.innerHeight);
    }
  }, [size.width, size.height, built]);

  // apply active style live to non-retired walkers
  useEffect(() => {
    for (const l of linesRef.current) {
      if (l.retired) continue;
      l.material.linewidth = active.width;
      l.material.opacity = active.opacity;
      applyColorAndGlow(l.material, active.color, active.glow, blendMode);
      l.material.needsUpdate = true;
    }
  }, [active, blendMode, built]);

  // apply retired style live to retired walkers
  useEffect(() => {
    for (const l of linesRef.current) {
      if (!l.retired) continue;
      l.material.linewidth = retired.width;
      l.material.opacity = retired.opacity;
      applyColorAndGlow(l.material, retired.color, retired.glow, blendMode);
      l.material.needsUpdate = true;
    }
  }, [retired, blendMode, built]);

  // apply blendMode to all walker materials
  useEffect(() => {
    const blending = blendingFor(blendMode);
    for (const l of linesRef.current) {
      l.material.blending = blending;
      l.material.needsUpdate = true;
    }
  }, [blendMode, built]);

  // visibility toggle
  useEffect(() => {
    if (activeGroupRef.current) {
      activeGroupRef.current.visible = visibility === "all" || visibility === "active";
    }
    if (retiredGroupRef.current) {
      retiredGroupRef.current.visible = visibility === "all" || visibility === "retired";
    }
  }, [visibility]);

  // step-size changes need full rebuild of uploaded positions
  useEffect(() => {
    for (const l of linesRef.current) {
      l.uploadedSegments = 0;
    }
  }, [stepSize]);

  useFrame((_, delta) => {
    const world = worldRef.current;
    const lines = linesRef.current;
    if (!world || lines.length === 0) return;

    if (playing) {
      frameAccum.current += delta * 60 * speed;
      let ticks = Math.floor(frameAccum.current);
      if (ticks > 0) {
        frameAccum.current -= ticks;
        ticks = Math.min(ticks, 8);

        for (let t = 0; t < ticks; t++) {
          world.tick();
          for (const l of lines) {
            if (l.retired || l.capped) continue;
            if (l.walker.steps.length >= MAX_STEPS) {
              l.capped = true;
              l.walker.active = false;
            }

            if (!l.walker.active && !l.retired) {
              l.retired = true;
              l.material.linewidth = retired.width;
              l.material.opacity = retired.opacity;
              applyColorAndGlow(l.material, retired.color, retired.glow, blendMode);
              l.material.needsUpdate = true;
              if (activeGroupRef.current && retiredGroupRef.current) {
                activeGroupRef.current.remove(l.line);
                retiredGroupRef.current.add(l.line);
              }
              if (l.walker.steps.length > longestRef.current) {
                longestRef.current = l.walker.steps.length;
              }
            }
          }
        }

        const now = performance.now();
        if (now - lastStatsAt.current > 100) {
          lastStatsAt.current = now;
          let totalSteps = 0;
          for (const l of lines) totalSteps += l.walker.steps.length;
          setStats({
            activeCount: world.active.length,
            retiredCount: world.retired.length,
            totalSteps,
            longestRetiredSteps: longestRef.current,
          });
        }
      }
    }

    for (const l of lines) {
      flushPositions(l, stepSize);
    }
  });

  return (
    <>
      <group ref={activeGroupRef} />
      <group ref={retiredGroupRef} />
    </>
  );
}
