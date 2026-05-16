"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { InstancedInterleavedBuffer, InterleavedBufferAttribute } from "three";
import { useSimStore, type BlendMode } from "@/store/sim-store";
import { World, type Walker, type Vec3 } from "@/lib/walker";
import { playHomeClick } from "@/lib/sfx";

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
  finalStepCount: number;
}

function makeMaterial(width: number, opacity: number, blendMode: BlendMode) {
  const m = new LineMaterial({
    color: 0xffffff,
    linewidth: width,
    worldUnits: false,
    transparent: true,
    opacity,
    blending: blendingFor(blendMode),
    premultipliedAlpha: true,
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
      finalStepCount: 0,
    };
  });
  return { world: w, refs };
}

function appendSegment(l: WalkerLineRef, from: Vec3, to: Vec3): boolean {
  if (l.uploadedSegments >= MAX_SEGMENTS) return false;
  const off = l.uploadedSegments * 6;
  l.buffer[off] = from[0];
  l.buffer[off + 1] = from[1];
  l.buffer[off + 2] = from[2];
  l.buffer[off + 3] = to[0];
  l.buffer[off + 4] = to[1];
  l.buffer[off + 5] = to[2];
  l.uploadedSegments++;
  l.interleaved.needsUpdate = true;
  l.geometry.instanceCount = l.uploadedSegments;
  return true;
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
  const totalStepsRef = useRef(0);
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
    totalStepsRef.current = 0;
    lastStatsAt.current = 0;
    setStats({
      activeCount: built.world.active.length,
      retiredCount: 0,
      totalSteps: 0,
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

  useEffect(() => {
    for (const l of linesRef.current) {
      l.material.resolution.set(size.width || window.innerWidth, size.height || window.innerHeight);
    }
  }, [size.width, size.height, built]);

  useEffect(() => {
    for (const l of linesRef.current) {
      if (l.retired) continue;
      l.material.linewidth = active.width;
      l.material.opacity = active.opacity;
      applyColorAndGlow(l.material, active.color, active.glow, blendMode);
      l.material.needsUpdate = true;
    }
  }, [active, blendMode, built]);

  useEffect(() => {
    for (const l of linesRef.current) {
      if (!l.retired) continue;
      l.material.linewidth = retired.width;
      l.material.opacity = retired.opacity;
      applyColorAndGlow(l.material, retired.color, retired.glow, blendMode);
      l.material.needsUpdate = true;
    }
  }, [retired, blendMode, built]);

  useEffect(() => {
    const blending = blendingFor(blendMode);
    for (const l of linesRef.current) {
      l.material.blending = blending;
      l.material.needsUpdate = true;
    }
  }, [blendMode, built]);

  useEffect(() => {
    if (activeGroupRef.current) {
      activeGroupRef.current.visible = visibility === "all" || visibility === "active";
    }
    if (retiredGroupRef.current) {
      retiredGroupRef.current.visible = visibility === "all" || visibility === "retired";
    }
  }, [visibility]);

  useFrame((_, delta) => {
    const world = worldRef.current;
    const lines = linesRef.current;
    if (!world || lines.length === 0) return;

    if (!playing) return;

    frameAccum.current += delta * 60 * speed;
    let ticks = Math.floor(frameAccum.current);
    if (ticks <= 0) return;
    frameAccum.current -= ticks;
    ticks = Math.min(ticks, 8);

    for (let t = 0; t < ticks; t++) {
      const { segments } = world.tick();
      for (const { walker, from, to } of segments) {
        const l = lines[walker.id];
        if (!l || l.capped) continue;
        appendSegment(l, from, to);
        totalStepsRef.current++;
      }

      for (const l of lines) {
        if (l.capped || l.retired) continue;

        if (l.uploadedSegments >= MAX_SEGMENTS && l.walker.active) {
          l.capped = true;
          l.walker.active = false;
        }

        if (!l.walker.active) {
          l.retired = true;
          l.finalStepCount = l.walker.stepCount;
          const pos = l.walker.position;
          const cameHome = !l.capped && pos[0] === 0 && pos[1] === 0 && pos[2] === 0;
          l.material.linewidth = retired.width;
          l.material.opacity = retired.opacity;
          applyColorAndGlow(l.material, retired.color, retired.glow, blendMode);
          l.material.needsUpdate = true;
          if (activeGroupRef.current && retiredGroupRef.current) {
            activeGroupRef.current.remove(l.line);
            retiredGroupRef.current.add(l.line);
          }
          if (l.finalStepCount > longestRef.current) {
            longestRef.current = l.finalStepCount;
          }
          if (cameHome) playHomeClick();
        }
      }
    }

    const now = performance.now();
    if (now - lastStatsAt.current > 100) {
      lastStatsAt.current = now;
      setStats({
        activeCount: world.active.length,
        retiredCount: world.retired.length,
        totalSteps: totalStepsRef.current,
        longestRetiredSteps: longestRef.current,
      });
    }
  });

  return (
    <group scale={[stepSize, stepSize, stepSize]}>
      <group ref={activeGroupRef} />
      <group ref={retiredGroupRef} />
    </group>
  );
}
