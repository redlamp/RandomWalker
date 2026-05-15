"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { useSimStore } from "@/store/sim-store";
import { World, type Walker } from "@/lib/walker";

const MAX_STEPS = 16384;

interface WalkerLineRef {
  walker: Walker;
  geometry: LineGeometry;
  material: LineMaterial;
  line: Line2;
  positions: Float32Array;
  uploadedSteps: number;
  retired: boolean;
  capped: boolean;
}

function makeMaterial(width: number, opacity: number) {
  const m = new LineMaterial({
    color: 0xffffff,
    linewidth: width,
    worldUnits: false,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    dashed: false,
  });
  return m;
}

function applyColorAndGlow(material: LineMaterial, hex: string, glow: number) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(Math.max(0, glow));
  material.color.copy(c);
}

function buildWorld(
  count: number,
  bound: number,
  seed: number,
  activeWidth: number,
  activeOpacity: number,
): { world: World; refs: WalkerLineRef[] } {
  const w = new World({ count, bound, seed });
  const refs: WalkerLineRef[] = w.active.map((walker) => {
    const positions = new Float32Array(MAX_STEPS * 3);
    const geom = new LineGeometry();
    geom.setPositions([0, 0, 0, 0, 0, 0]);

    const mat = makeMaterial(activeWidth, activeOpacity);
    const line = new Line2(geom, mat);
    line.frustumCulled = false;
    line.computeLineDistances();

    return {
      walker,
      geometry: geom,
      material: mat,
      line,
      positions,
      uploadedSteps: 1,
      retired: false,
      capped: false,
    };
  });
  return { world: w, refs };
}

function flushPositions(l: WalkerLineRef, stepSize: number) {
  const stepsLen = Math.min(l.walker.steps.length, MAX_STEPS);
  if (stepsLen === l.uploadedSteps) return;

  for (let i = l.uploadedSteps; i < stepsLen; i++) {
    const s = l.walker.steps[i];
    const j = i * 3;
    l.positions[j] = s[0] * stepSize;
    l.positions[j + 1] = s[1] * stepSize;
    l.positions[j + 2] = s[2] * stepSize;
  }

  const view = l.positions.subarray(0, stepsLen * 3);
  l.geometry.setPositions(view);
  l.uploadedSteps = stepsLen;
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
  const setStats = useSimStore((s) => s.setStats);

  const { size } = useThree();

  const worldRef = useRef<World | null>(null);
  const linesRef = useRef<WalkerLineRef[]>([]);
  const frameAccum = useRef(0);
  const longestRef = useRef(0);
  const activeGroupRef = useRef<THREE.Group>(null);
  const retiredGroupRef = useRef<THREE.Group>(null);

  const built = useMemo(
    () => buildWorld(walkerCount, bound, seed, active.width, active.opacity),
    // intentionally exclude active.* — they're applied via a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // keep LineMaterial resolution synced
  useEffect(() => {
    for (const l of linesRef.current) {
      l.material.resolution.set(size.width, size.height);
    }
  }, [size.width, size.height, built]);

  // apply active style live to non-retired walkers
  useEffect(() => {
    for (const l of linesRef.current) {
      if (l.retired) continue;
      l.material.linewidth = active.width;
      l.material.opacity = active.opacity;
      applyColorAndGlow(l.material, active.color, active.glow);
      l.material.needsUpdate = true;
    }
  }, [active, built]);

  // apply retired style live to retired walkers
  useEffect(() => {
    for (const l of linesRef.current) {
      if (!l.retired) continue;
      l.material.linewidth = retired.width;
      l.material.opacity = retired.opacity;
      applyColorAndGlow(l.material, retired.color, retired.glow);
      l.material.needsUpdate = true;
    }
  }, [retired, built]);

  // visibility toggle
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
              applyColorAndGlow(l.material, retired.color, retired.glow);
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

    // upload any pending step changes (incl. step-size live updates)
    for (const l of lines) {
      flushPositions(l, stepSize);
    }
  });

  // step-size changes need full rebuild of uploaded positions
  useEffect(() => {
    for (const l of linesRef.current) {
      l.uploadedSteps = 0;
      // re-write origin into buffer
      l.positions[0] = 0;
      l.positions[1] = 0;
      l.positions[2] = 0;
    }
  }, [stepSize, built]);

  return (
    <>
      <group ref={activeGroupRef} />
      <group ref={retiredGroupRef} />
    </>
  );
}
