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
  newSeedOnStart: boolean;
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
  audioEnabled: boolean;
}

export interface SimStats {
  activeCount: number;
  retiredCount: number;
  totalSteps: number;
  longestRetiredSteps: number;
  fps: number;
}

export interface WorldDefaults {
  walkerCount: number;
  bound: number;
  stepSize: number;
  speed: number;
  showBoundingCube: boolean;
  newSeedOnStart: boolean;
  seed: number;
}

interface SimStore extends SimConfig, SimStats {
  generation: number;
  screenshotFn: (() => void) | null;
  cameraDir: [number, number, number];
  cameraUp: [number, number, number];
  snapToView: ViewSide | null;
  gizmoOverride: [number, number, number] | null;
  controlPanelOpen: boolean;
  openSections: string[];
  worldDefaults: WorldDefaults | null;
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
  setControlPanelOpen: (open: boolean) => void;
  setOpenSections: (sections: string[]) => void;
  resetWorldDefaults: () => void;
  saveCurrentAsWorldDefaults: () => void;
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
  seed: 2,
  newSeedOnStart: true,
  speed: 1,
  playing: true,
  showBoundingCube: false,
  visibility: "all",
  cameraMode: "perspective",
  cameraAutoOrbit: true,
  cameraOrbitSpeed: 0.5,
  theme: "dark",
  audioEnabled: false,
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
      controlPanelOpen: false,
      openSections: [],
      worldDefaults: null,
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
      setControlPanelOpen: (open) => set({ controlPanelOpen: open }),
      setOpenSections: (sections) => set({ openSections: sections }),
      resetWorldDefaults: () =>
        set((s) => {
          const d = s.worldDefaults ?? DEFAULT_CONFIG;
          return {
            walkerCount: d.walkerCount,
            bound: d.bound,
            stepSize: d.stepSize,
            speed: d.speed,
            showBoundingCube: d.showBoundingCube,
            newSeedOnStart: d.newSeedOnStart,
            seed: d.seed,
            generation: s.generation + 1,
            activeCount: 0,
            retiredCount: 0,
            totalSteps: 0,
            longestRetiredSteps: 0,
          };
        }),
      saveCurrentAsWorldDefaults: () =>
        set((s) => ({
          worldDefaults: {
            walkerCount: s.walkerCount,
            bound: s.bound,
            stepSize: s.stepSize,
            speed: s.speed,
            showBoundingCube: s.showBoundingCube,
            newSeedOnStart: s.newSeedOnStart,
            seed: s.seed,
          },
        })),
    }),
    {
      name: "random-walker-prefs",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => persisted as Partial<SimStore>,
      partialize: (state) => ({
        seed: state.seed,
        newSeedOnStart: state.newSeedOnStart,
        walkerCount: state.walkerCount,
        bound: state.bound,
        stepSize: state.stepSize,
        speed: state.speed,
        visibility: state.visibility,
        active: state.active,
        retired: state.retired,
        cameraOrbitSpeed: state.cameraOrbitSpeed,
        theme: state.theme,
        playing: state.playing,
        cameraAutoOrbit: state.cameraAutoOrbit,
        showBoundingCube: state.showBoundingCube,
        cameraMode: state.cameraMode,
        controlPanelOpen: state.controlPanelOpen,
        openSections: state.openSections,
        worldDefaults: state.worldDefaults,
        audioEnabled: state.audioEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // setTheme re-applies the preset (worldBackground, bloomEnabled,
        // blendMode + the default active/retired colors for that theme).
        // Then re-overlay the persisted custom walker styles so the user's
        // manual edits survive the preset re-apply.
        const savedActive = state.active;
        const savedRetired = state.retired;
        state.setTheme(state.theme);
        state.setConfig({ active: savedActive, retired: savedRetired });
        if (state.newSeedOnStart) {
          state.reset(Math.floor(Math.random() * 1e9));
        }
      },
    },
  ),
);
