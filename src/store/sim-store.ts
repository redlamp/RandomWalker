"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type VisibilityMode = "all" | "active" | "retired";

export interface GroupStyle {
  width: number;
  color: string;
  opacity: number;
  glow: number;
}

export type CameraMode = "perspective" | "orthographic";
export type ThemeMode = "dark" | "light";
export type BlendMode = "additive" | "multiply" | "normal";
export type ViewSide = "+x" | "-x" | "+y" | "-y" | "+z" | "-z" | "default";

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
  theme: ThemeMode;
  worldBackground: string;
  bloomEnabled: boolean;
  blendMode: BlendMode;
}

export interface SimStats {
  activeCount: number;
  retiredCount: number;
  totalSteps: number;
  longestRetiredSteps: number;
  fps: number;
}

interface SimStore extends SimConfig, SimStats {
  generation: number;
  screenshotFn: (() => void) | null;
  cameraDir: [number, number, number];
  cameraUp: [number, number, number];
  snapToView: ViewSide | null;
  gizmoOverride: [number, number, number] | null;
  setConfig: (patch: Partial<SimConfig>) => void;
  setActive: (patch: Partial<GroupStyle>) => void;
  setRetired: (patch: Partial<GroupStyle>) => void;
  setTheme: (theme: ThemeMode) => void;
  reset: (newSeed?: number) => void;
  togglePlaying: () => void;
  setStats: (stats: Partial<SimStats>) => void;
  setScreenshotFn: (fn: (() => void) | null) => void;
  setCameraDir: (dir: [number, number, number]) => void;
  setCameraUp: (up: [number, number, number]) => void;
  requestSnap: (view: ViewSide) => void;
  clearSnap: () => void;
  setGizmoOverride: (dir: [number, number, number] | null) => void;
}

const DARK_PRESET = {
  worldBackground: "#050509",
  active: { width: 1, color: "#ff80ff", opacity: 0.2, glow: 0.2 } as GroupStyle,
  retired: { width: 1, color: "#00ffff", opacity: 0.5, glow: 0.6 } as GroupStyle,
  bloomEnabled: true,
  blendMode: "additive" as BlendMode,
};

const LIGHT_PRESET = {
  worldBackground: "#e3dbca",
  active: { width: 1, color: "#ff00ff", opacity: 0.18, glow: 0 } as GroupStyle,
  retired: { width: 1, color: "#8040ff", opacity: 0.55, glow: 0 } as GroupStyle,
  bloomEnabled: false,
  blendMode: "multiply" as BlendMode,
};

const DEFAULT_CONFIG: SimConfig = {
  walkerCount: 128,
  bound: 32,
  stepSize: 1,
  seed: 1,
  speed: 1,
  playing: true,
  showBoundingCube: true,
  visibility: "all",
  cameraMode: "perspective",
  cameraAutoOrbit: true,
  cameraOrbitSpeed: 0.5,
  theme: "dark",
  ...DARK_PRESET,
};

export const useSimStore = create<SimStore>()(
  persist(
    (set) => ({
      ...DEFAULT_CONFIG,
      activeCount: 0,
      retiredCount: 0,
      totalSteps: 0,
      longestRetiredSteps: 0,
      fps: 0,
      generation: 0,
      screenshotFn: null,
      cameraDir: [1, 0.7, 1],
      cameraUp: [0, 1, 0],
      snapToView: null,
      gizmoOverride: null,
      setConfig: (patch) => set((s) => ({ ...s, ...patch })),
      setScreenshotFn: (fn) => set({ screenshotFn: fn }),
      setCameraDir: (dir) => set({ cameraDir: dir }),
      setCameraUp: (up) => set({ cameraUp: up }),
      requestSnap: (view) => set({ snapToView: view }),
      clearSnap: () => set({ snapToView: null }),
      setGizmoOverride: (dir) => set({ gizmoOverride: dir }),
      setActive: (patch) => set((s) => ({ active: { ...s.active, ...patch } })),
      setRetired: (patch) => set((s) => ({ retired: { ...s.retired, ...patch } })),
      setTheme: (theme) =>
        set(() => ({
          theme,
          ...(theme === "dark" ? DARK_PRESET : LIGHT_PRESET),
        })),
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
    }),
    {
      name: "random-walker-prefs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        playing: state.playing,
        cameraAutoOrbit: state.cameraAutoOrbit,
        showBoundingCube: state.showBoundingCube,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setTheme(state.theme);
      },
    },
  ),
);
