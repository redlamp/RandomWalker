"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Sun, Moon } from "lucide-react";
import { useSimStore } from "@/store/sim-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleButton() {
  const theme = useSimStore((s) => s.theme);
  const setTheme = useSimStore((s) => s.setTheme);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!iconRef.current) return;
    gsap.fromTo(
      iconRef.current,
      { rotate: -180, opacity: 0 },
      { rotate: 0, opacity: 1, duration: 0.35, ease: "power3.out" },
    );
  }, [theme]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg text-secondary-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            <span ref={iconRef} className="inline-flex">
              {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </span>
          </Button>
        }
      />
      <TooltipContent>
        {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      </TooltipContent>
    </Tooltip>
  );
}
