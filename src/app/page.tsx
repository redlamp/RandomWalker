import { ControlPanel } from "@/components/control-panel";
import { CameraPanel } from "@/components/camera-panel";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { AudioToggleButton } from "@/components/audio-toggle-button";
import { RandomWalkerScene } from "@/components/scene/RandomWalkerScene";

export default function Home() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-black text-foreground">
      <div className="absolute inset-0">
        <RandomWalkerScene />
      </div>
      <div className="absolute top-4 left-4 z-10">
        <ControlPanel />
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <AudioToggleButton />
        <ThemeToggleButton />
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <CameraPanel />
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono">
        Random Walkers · 3D
      </div>
    </main>
  );
}
