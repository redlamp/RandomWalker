"use client";

import { create } from "zustand";

export interface SimConfig {
  walkerCount: number;
  bound: number;
  stepSize: number;
  seed: number;
  speed: number;
  playing: boolean;
  showBoundingCube: boolean;
  bloomIntensity: number;
}

export interface SimStats {
  activeCount: number;
  retiredCount: number;
  totalSteps: number;
  longestRetiredSteps: number;
}

interface SimStore extends SimConfig, SimStats {
  generation: number;
  setConfig: (patch: Partial<SimConfig>) => void;
  reset: (newSeed?: number) => void;
  togglePlaying: () => void;
  setStats: (stats: Partial<SimStats>) => void;
}

const DEFAULT_CONFIG: SimConfig = {
  walkerCount: 64,
  bound: 20,
  stepSize: 1,
  seed: 1,
  speed: 1,
  playing: true,
  showBoundingCube: true,
  bloomIntensity: 0.8,
};

export const useSimStore = create<SimStore>((set) => ({
  ...DEFAULT_CONFIG,
  activeCount: 0,
  retiredCount: 0,
  totalSteps: 0,
  longestRetiredSteps: 0,
  generation: 0,
  setConfig: (patch) => set((s) => ({ ...s, ...patch })),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  reset: (newSeed) =>
    set((s) => ({
      generation: s.generation + 1,
      seed: newSeed ?? s.seed,
      playing: true,
      activeCount: 0,
      retiredCount: 0,
      totalSteps: 0,
      longestRetiredSteps: 0,
    })),
  setStats: (stats) => set(stats),
}));
