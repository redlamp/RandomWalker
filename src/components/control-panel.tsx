"use client";

import { useState } from "react";
import { useSimStore, type GroupStyle, type VisibilityMode } from "@/store/sim-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function toScalar(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Badge variant="outline" className="font-mono tabular-nums">
          {format ? format(value) : value}
        </Badge>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(toScalar(v))}
      />
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono">
          {value.toUpperCase()}
        </Badge>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer border border-border bg-transparent p-0"
          aria-label={`${label} color`}
        />
      </div>
    </div>
  );
}

function GroupStyleSection({
  title,
  style,
  setStyle,
}: {
  title: string;
  style: GroupStyle;
  setStyle: (patch: Partial<GroupStyle>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <SliderRow
        label="Width"
        value={style.width}
        min={0.5}
        max={8}
        step={0.1}
        format={(v) => v.toFixed(1)}
        onChange={(v) => setStyle({ width: v })}
      />
      <ColorRow label="Color" value={style.color} onChange={(v) => setStyle({ color: v })} />
      <SliderRow
        label="Opacity"
        value={style.opacity}
        min={0.05}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => setStyle({ opacity: v })}
      />
      <SliderRow
        label="Glow"
        value={style.glow}
        min={0}
        max={4}
        step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => setStyle({ glow: v })}
      />
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Badge variant="secondary" className="font-mono tabular-nums">
        {value}
      </Badge>
    </div>
  );
}

export function ControlPanel() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    walkerCount,
    bound,
    stepSize,
    speed,
    seed,
    playing,
    showBoundingCube,
    visibility,
    active,
    retired,
    activeCount,
    retiredCount,
    totalSteps,
    longestRetiredSteps,
    setConfig,
    setActive,
    setRetired,
    reset,
  } = useSimStore();

  return (
    <Card className="w-80 backdrop-blur-md bg-card/70 border-border/50 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 shrink-0">
        <CardTitle className="text-base tracking-tight">Random Walker</CardTitle>
        <Badge variant={playing ? "default" : "outline"} className="font-mono">
          {playing ? "live" : "paused"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto">
        <div className="flex gap-2">
          <Toggle
            pressed={playing}
            onPressedChange={(pressed) => setConfig({ playing: pressed })}
            variant="outline"
            className="flex-1"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "Pause" : "Play"}
          </Toggle>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="outline" onClick={() => reset()} className="flex-1">
                  Reset
                </Button>
              }
            />
            <TooltipContent>Restart with current seed (keeps play/pause state)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => reset(Math.floor(Math.random() * 1e9))}
                  aria-label="New seed"
                >
                  🎲
                </Button>
              }
            />
            <TooltipContent>New random seed</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Show</Label>
          <ToggleGroup
            value={[visibility]}
            onValueChange={(arr) => {
              const next = (arr[0] ?? visibility) as VisibilityMode;
              setConfig({ visibility: next });
            }}
            variant="outline"
            className="w-full"
          >
            <ToggleGroupItem value="all" className="flex-1">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="active" className="flex-1">
              Walkers
            </ToggleGroupItem>
            <ToggleGroupItem value="retired" className="flex-1">
              Retired
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <StatRow label="Active" value={activeCount} />
          <StatRow label="Retired" value={retiredCount} />
          <StatRow label="Total steps" value={totalSteps} />
          <StatRow label="Longest retired" value={longestRetiredSteps} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">Seed</span>
            <Badge variant="outline" className="font-mono">
              {seed}
            </Badge>
          </div>
        </div>

        <Separator />

        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger
            render={
              <Button variant="outline" className="w-full justify-between">
                <span>Settings</span>
                <span className="font-mono text-xs">{settingsOpen ? "−" : "+"}</span>
              </Button>
            }
          />
          <CollapsibleContent className="pt-4 space-y-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                World
              </div>
              <SliderRow
                label="Walkers"
                value={walkerCount}
                min={1}
                max={256}
                step={1}
                onChange={(v) => setConfig({ walkerCount: v })}
              />
              <SliderRow
                label="Bound"
                value={bound}
                min={4}
                max={64}
                step={1}
                onChange={(v) => setConfig({ bound: v })}
              />
              <SliderRow
                label="Step size"
                value={stepSize}
                min={0.25}
                max={4}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(v) => setConfig({ stepSize: v })}
              />
              <SliderRow
                label="Speed"
                value={speed}
                min={0.1}
                max={8}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(v) => setConfig({ speed: v })}
              />
              <div className="flex items-center justify-between">
                <Label htmlFor="cube-toggle" className="text-xs text-muted-foreground">
                  Bounding cube
                </Label>
                <Switch
                  id="cube-toggle"
                  checked={showBoundingCube}
                  onCheckedChange={(v) => setConfig({ showBoundingCube: v })}
                />
              </div>
            </div>

            <Separator />

            <GroupStyleSection title="Walkers" style={active} setStyle={setActive} />

            <Separator />

            <GroupStyleSection title="Retired" style={retired} setStyle={setRetired} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
