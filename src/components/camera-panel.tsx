"use client";

import { useSimStore, type CameraMode } from "@/store/sim-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function toScalar(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function CameraPanel() {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const cameraAutoOrbit = useSimStore((s) => s.cameraAutoOrbit);
  const cameraOrbitSpeed = useSimStore((s) => s.cameraOrbitSpeed);
  const fps = useSimStore((s) => s.fps);
  const setConfig = useSimStore((s) => s.setConfig);

  return (
    <Card
      size="sm"
      className="w-64 backdrop-blur-md bg-card/70 border-border/50 shadow-2xl gap-2"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
          Camera
        </CardTitle>
        <Badge variant="secondary" className="font-mono tabular-nums">
          {fps} fps
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
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
          <Label className="text-xs text-muted-foreground">Auto-orbit</Label>
          <Toggle
            pressed={cameraAutoOrbit}
            onPressedChange={(pressed) => setConfig({ cameraAutoOrbit: pressed })}
            variant="outline"
            size="sm"
            aria-label={cameraAutoOrbit ? "Pause orbit" : "Play orbit"}
          >
            {cameraAutoOrbit ? "Pause" : "Play"}
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
            max={4}
            step={0.05}
            onValueChange={(v) => setConfig({ cameraOrbitSpeed: toScalar(v) })}
            disabled={!cameraAutoOrbit}
          />
        </div>
      </CardContent>
    </Card>
  );
}
