"use client";

import { useState } from "react";
import { useSimStore, type CameraMode } from "@/store/sim-store";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Camera, Rotate3d } from "lucide-react";
import { CameraGizmo } from "@/components/camera-gizmo";

function toScalar(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function CameraPanel() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const cameraAutoOrbit = useSimStore((s) => s.cameraAutoOrbit);
  const cameraOrbitSpeed = useSimStore((s) => s.cameraOrbitSpeed);
  const fps = useSimStore((s) => s.fps);
  const screenshotFn = useSimStore((s) => s.screenshotFn);
  const setConfig = useSimStore((s) => s.setConfig);

  const [open, setOpen] = useState(false);

  return (
    <Card
      size="sm"
      className="w-64 backdrop-blur-md bg-card/70 border-border/50 shadow-2xl gap-2"
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-1 text-left hover:bg-muted/30 transition-colors"
            >
              <h2 className="font-heading text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Camera
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {fps} fps
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {open ? "−" : "+"}
                </span>
              </div>
            </button>
          }
        />

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-3 border-t border-border/30">
            <CameraGizmo />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">View</Label>
              <ToggleGroup
                value={[cameraMode]}
                onValueChange={(arr) => {
                  const next = (arr[0] ?? cameraMode) as CameraMode;
                  setConfig({ cameraMode: next });
                }}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="perspective" className="flex-1">
                  Perspective
                </ToggleGroupItem>
                <ToggleGroupItem value="orthographic" className="flex-1">
                  Isometric
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Rotate3d className="size-3.5" />
                Orbit
              </Label>
              <Toggle
                pressed={cameraAutoOrbit}
                onPressedChange={(pressed) => setConfig({ cameraAutoOrbit: pressed })}
                variant="outline"
                size="sm"
                aria-label={cameraAutoOrbit ? "Pause orbit" : "Play orbit"}
              >
                <Rotate3d className="size-3.5" />
              </Toggle>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Speed</Label>
                <Badge variant="outline" className="font-mono tabular-nums">
                  {cameraOrbitSpeed.toFixed(2)}×
                </Badge>
              </div>
              <Slider
                value={[cameraOrbitSpeed]}
                min={0.05}
                max={2}
                step={0.05}
                onValueChange={(v) => setConfig({ cameraOrbitSpeed: toScalar(v) })}
                disabled={!cameraAutoOrbit}
              />
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => screenshotFn?.()}
              disabled={!screenshotFn}
            >
              <Camera className="size-4" />
              Export PNG
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
