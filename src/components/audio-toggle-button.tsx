"use client";

import { useEffect } from "react";
import { Volume2, VolumeOff } from "lucide-react";
import { useSimStore } from "@/store/sim-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { tryResume } from "@/lib/sfx";

export function AudioToggleButton() {
  const audioEnabled = useSimStore((s) => s.audioEnabled);
  const setConfig = useSimStore((s) => s.setConfig);

  useEffect(() => {
    if (audioEnabled) tryResume();
  }, [audioEnabled]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="shadow-lg text-secondary-foreground"
            onClick={() => {
              const next = !audioEnabled;
              setConfig({ audioEnabled: next });
              if (next) tryResume();
            }}
            aria-label={audioEnabled ? "Mute audio" : "Enable audio"}
          >
            {audioEnabled ? <Volume2 className="size-4" /> : <VolumeOff className="size-4" />}
          </Button>
        }
      />
      <TooltipContent>{audioEnabled ? "Mute audio" : "Enable audio"}</TooltipContent>
    </Tooltip>
  );
}
