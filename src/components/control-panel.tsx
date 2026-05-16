"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useSimStore, type GroupStyle, type VisibilityMode } from "@/store/sim-store";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ChartColumn, ChevronDown, Dices, Footprints, Globe, House, Pause, Play, RotateCcw } from "lucide-react";

function toScalar(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

function snapToStep(v: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, v));
  if (step <= 0) return clamped;
  const steps = Math.round((clamped - min) / step);
  const snapped = min + steps * step;
  const decimals = (step.toString().split(".")[1] ?? "").length;
  return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
}

interface NumberInputProps {
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}

function NumberInput({
  value,
  min,
  max,
  step,
  format,
  onChange,
  className,
  ariaLabel,
}: NumberInputProps) {
  const display = format ? format(value) : String(value);
  const [text, setText] = useState(display);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(display);
  }, [display, focused]);

  const commit = () => {
    const n = parseFloat(text);
    if (!Number.isFinite(n)) {
      setText(display);
      return;
    }
    const snapped = snapToStep(n, min, max, step);
    if (snapped !== value) onChange(snapped);
    setText(format ? format(snapped) : String(snapped));
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setText(display);
          (e.target as HTMLInputElement).blur();
        }
      }}
      aria-label={ariaLabel}
      className={cn(
        "h-6 w-16 px-2 py-0 text-xs font-mono tabular-nums text-right",
        className,
      )}
    />
  );
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
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <NumberInput
          value={value}
          min={min}
          max={max}
          step={step}
          format={format}
          onChange={onChange}
          ariaLabel={label}
        />
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

function HexInput({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  const display = value.toUpperCase();
  const [text, setText] = useState(display);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(display);
  }, [display, focused]);

  const commit = () => {
    let v = text.trim();
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      onChange(v.toLowerCase());
      setText(v.toUpperCase());
    } else {
      setText(display);
    }
  };

  return (
    <Input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value.toUpperCase())}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setText(display);
          (e.target as HTMLInputElement).blur();
        }
      }}
      aria-label={`${label} hex value`}
      className="h-6 w-20 px-2 py-0 text-xs font-mono uppercase tracking-wider"
    />
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
        <HexInput value={value} onChange={onChange} label={label} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-8 cursor-pointer appearance-none border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:border-0"
          aria-label={`${label} color picker`}
        />
      </div>
    </div>
  );
}

function Section({
  value,
  title,
  icon,
  children,
  rightSlot,
}: {
  value: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="not-last:border-b border-foreground/15">
      <AccordionTrigger className="px-3 py-2 text-xs uppercase tracking-widest font-medium hover:no-underline hover:bg-muted/30 transition-colors items-center gap-2">
        <span className="flex flex-1 min-w-0 items-center gap-1.5">
          {icon}
          {title}
        </span>
        {rightSlot && <span className="flex shrink-0 items-center mr-2">{rightSlot}</span>}
      </AccordionTrigger>
      <AccordionContent className="px-3 pt-1 pb-3 space-y-3">{children}</AccordionContent>
    </AccordionItem>
  );
}

function GroupStyleBody({
  style,
  setStyle,
}: {
  style: GroupStyle;
  setStyle: (patch: Partial<GroupStyle>) => void;
}) {
  return (
    <>
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
    </>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function ControlPanel() {
  const panelOpen = useSimStore((s) => s.controlPanelOpen);
  const setPanelOpen = useSimStore((s) => s.setControlPanelOpen);
  const openSections = useSimStore((s) => s.openSections);
  const setOpenSections = useSimStore((s) => s.setOpenSections);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!chevronRef.current) return;
    gsap.to(chevronRef.current, {
      rotate: panelOpen ? 180 : 0,
      duration: 0.35,
      ease: "power3.out",
    });
  }, [panelOpen]);

  const walkerCount = useSimStore((s) => s.walkerCount);
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const speed = useSimStore((s) => s.speed);
  const seed = useSimStore((s) => s.seed);
  const playing = useSimStore((s) => s.playing);
  const showBoundingCube = useSimStore((s) => s.showBoundingCube);
  const newSeedOnStart = useSimStore((s) => s.newSeedOnStart);
  const visibility = useSimStore((s) => s.visibility);
  const active = useSimStore((s) => s.active);
  const retired = useSimStore((s) => s.retired);
  const activeCount = useSimStore((s) => s.activeCount);
  const retiredCount = useSimStore((s) => s.retiredCount);
  const totalSteps = useSimStore((s) => s.totalSteps);
  const longestRetiredSteps = useSimStore((s) => s.longestRetiredSteps);
  const setConfig = useSimStore((s) => s.setConfig);
  const setActive = useSimStore((s) => s.setActive);
  const setRetired = useSimStore((s) => s.setRetired);
  const reset = useSimStore((s) => s.reset);

  return (
    <Card className="w-80 backdrop-blur-md bg-card/70 border-border/50 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col gap-3 py-3">
      <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-1 text-left hover:bg-muted/30 transition-colors"
              aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
            >
              <h1 className="font-heading text-base font-semibold uppercase leading-snug tracking-widest">
                Random Walkers
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={playing ? "default" : "outline"} className="font-mono">
                  {playing ? "live" : "paused"}
                </Badge>
                <ChevronDown ref={chevronRef} className="size-4 text-muted-foreground" />
              </div>
            </button>
          }
        />
        <CollapsibleContent>
          <CardContent className="space-y-3 overflow-y-auto pb-1 pt-3 border-t border-border/30">
        <div className="flex gap-2">
          <Toggle
            pressed={playing}
            onPressedChange={(pressed) => setConfig({ playing: pressed })}
            variant="outline"
            className="flex-1"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Toggle>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => reset()}
                  aria-label="Reset"
                  className="flex-1"
                >
                  <RotateCcw className="size-4" />
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
                  <Dices className="size-4" />
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
            <ToggleGroupItem value="active" className="flex-1 gap-1.5" aria-label="Show walking">
              <Footprints className="size-3.5" />
              Walking
            </ToggleGroupItem>
            <ToggleGroupItem value="retired" className="flex-1 gap-1.5" aria-label="Show home">
              <House className="size-3.5" />
              Home
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Accordion multiple value={openSections} onValueChange={setOpenSections} className="rounded-lg ring-1 ring-foreground/15 bg-card/40 overflow-hidden">
          <Section value="world" title="World" icon={<Globe className="size-3.5" />}>
            <SliderRow
              label="Count"
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
            <div className="flex items-center justify-between">
              <Label htmlFor="new-seed-toggle" className="text-xs text-muted-foreground">
                New seed on start
              </Label>
              <Switch
                id="new-seed-toggle"
                checked={newSeedOnStart}
                onCheckedChange={(v) => setConfig({ newSeedOnStart: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <Label className="text-xs text-muted-foreground">Seed</Label>
              <NumberInput
                value={seed}
                min={0}
                max={1e9}
                step={1}
                onChange={(v) => reset(v)}
                ariaLabel="Seed"
                className="w-24"
              />
            </div>
          </Section>

          <Section
            value="walking"
            title="Walking"
            icon={<Footprints className="size-3.5" />}
            rightSlot={
              <Badge
                variant="outline"
                className="font-mono tabular-nums"
                style={{ borderColor: active.color, color: active.color }}
              >
                {activeCount}
              </Badge>
            }
          >
            <GroupStyleBody style={active} setStyle={setActive} />
          </Section>

          <Section
            value="home"
            title="Home"
            icon={<House className="size-3.5" />}
            rightSlot={
              <Badge
                variant="outline"
                className="font-mono tabular-nums"
                style={{ borderColor: retired.color, color: retired.color }}
              >
                {retiredCount}
              </Badge>
            }
          >
            <GroupStyleBody style={retired} setStyle={setRetired} />
          </Section>

          <Section
            value="stats"
            title="Stats"
            icon={<ChartColumn className="size-3.5" />}
          >
            <StatRow label="Total steps" value={totalSteps} />
            <StatRow label="Longest home" value={longestRetiredSteps} />
          </Section>
        </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
