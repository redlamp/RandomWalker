"use client";

import { create } from "zustand";

export type VisibilityMode = "all" | "active" | "retired";

export interface GroupStyle {
  width: number;
  color: string;
  opacity: number;
  glow: number;
}

export type CameraMode = "perspective" | "orthographic";

export interface SimConfig {
  walkerCount: number;
  bound: number;
  stepSize: number;
  seed: number;
  speed: number;
  playing: boolean;
  showBoundingCube: boolean;
  visibility: VisibilityMode;
  active: GroupStyle;
  retired: GroupStyle;
  cameraMode: CameraMode;
  cameraAutoOrbit: boolean;
  cameraOrbitSpeed: number;
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
  setActive: (patch: Partial<GroupStyle>) => void;
  setRetired: (patch: Partial<GroupStyle>) => void;
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
  visibility: "all",
  active: {
    width: 1.5,
    color: "#ff80ff",
    opacity: 0.35,
    glow: 1.0,
  },
  retired: {
    width: 2.5,
    color: "#ff3df0",
    opacity: 0.9,
    glow: 1.8,
  },
  cameraMode: "perspective",
  cameraAutoOrbit: false,
  cameraOrbitSpeed: 0.5,
};

export const useSimStore = create<SimStore>((set) => ({
  ...DEFAULT_CONFIG,
  activeCount: 0,
  retiredCount: 0,
  totalSteps: 0,
  longestRetiredSteps: 0,
  generation: 0,
  setConfig: (patch) => set((s) => ({ ...s, ...patch })),
  setActive: (patch) => set((s) => ({ active: { ...s.active, ...patch } })),
  setRetired: (patch) => set((s) => ({ retired: { ...s.retired, ...patch } })),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  reset: (newSeed) =>
    set((s) => ({
      generation: s.generation + 1,
      seed: newSeed ?? s.seed,
      activeCount: 0,
      retiredCount: 0,
      totalSteps: 0,
      longestRetiredSteps: 0,
    })),
  setStats: (stats) => set(stats),
}));
