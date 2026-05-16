"use client";

import { useEffect } from "react";
import { useSimStore } from "@/store/sim-store";

export function ThemeBridge() {
  const theme = useSimStore((s) => s.theme);
  const activeColor = useSimStore((s) => s.active.color);
  const retiredColor = useSimStore((s) => s.retired.color);
  const worldBackground = useSimStore((s) => s.worldBackground);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--walker-active", activeColor);
    root.style.setProperty("--walker-retired", retiredColor);
    root.style.setProperty("--walker-bg", worldBackground);
  }, [activeColor, retiredColor, worldBackground]);

  return null;
}
