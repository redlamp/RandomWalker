"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "@/store/sim-store";

export function FpsReporter() {
  const setStats = useSimStore((s) => s.setStats);
  const lastUpdate = useRef(0);
  const ema = useRef(60);

  useFrame((_, delta) => {
    if (delta <= 0) return;
    const inst = 1 / delta;
    ema.current = ema.current * 0.9 + inst * 0.1;
    const now = performance.now();
    if (now - lastUpdate.current > 250) {
      lastUpdate.current = now;
      setStats({ fps: Math.round(ema.current) });
    }
  });

  return null;
}
