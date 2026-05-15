"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { useSimStore } from "@/store/sim-store";
import { WalkerSim } from "./WalkerSim";
import { BoundingCube } from "./BoundingCube";

export function RandomWalkerScene() {
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const showBoundingCube = useSimStore((s) => s.showBoundingCube);
  const bloomIntensity = useSimStore((s) => s.bloomIntensity);

  const camDist = bound * stepSize * 3.2;

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ background: "radial-gradient(circle at center, #11111c 0%, #050509 70%)" }}
    >
      <PerspectiveCamera makeDefault position={[camDist, camDist * 0.7, camDist]} fov={45} />
      <OrbitControls enableDamping dampingFactor={0.08} makeDefault />
      <ambientLight intensity={0.4} />
      <pointLight position={[50, 50, 50]} intensity={0.6} />
      {showBoundingCube && <BoundingCube bound={bound} stepSize={stepSize} />}
      <WalkerSim />
      <EffectComposer>
        <Bloom intensity={bloomIntensity} kernelSize={KernelSize.LARGE} luminanceThreshold={0.05} luminanceSmoothing={0.2} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
