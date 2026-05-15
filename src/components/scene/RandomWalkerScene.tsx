"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { useSimStore } from "@/store/sim-store";
import { WalkerSim } from "./WalkerSim";
import { BoundingCube } from "./BoundingCube";

export function RandomWalkerScene() {
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const showBoundingCube = useSimStore((s) => s.showBoundingCube);
  const cameraMode = useSimStore((s) => s.cameraMode);
  const cameraAutoOrbit = useSimStore((s) => s.cameraAutoOrbit);
  const cameraOrbitSpeed = useSimStore((s) => s.cameraOrbitSpeed);

  const camDist = bound * stepSize * 3.2;
  const camPos = useMemo<[number, number, number]>(
    () => [camDist, camDist * 0.7, camDist],
    [camDist],
  );

  // isometric view: 1, 1, 1 normalized to camDist
  const isoDist = bound * stepSize * 2.2;
  const isoPos = useMemo<[number, number, number]>(
    () => [isoDist, isoDist, isoDist],
    [isoDist],
  );
  const orthoZoom = 30 / Math.max(stepSize, 0.01);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ background: "radial-gradient(circle at center, #11111c 0%, #050509 70%)" }}
    >
      {cameraMode === "perspective" ? (
        <PerspectiveCamera makeDefault position={camPos} fov={45} />
      ) : (
        <OrthographicCamera makeDefault position={isoPos} zoom={orthoZoom} near={-1000} far={1000} />
      )}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        makeDefault
        autoRotate={cameraAutoOrbit}
        autoRotateSpeed={cameraOrbitSpeed * 2}
      />
      <ambientLight intensity={0.4} />
      <pointLight position={[50, 50, 50]} intensity={0.6} />
      {showBoundingCube && <BoundingCube bound={bound} stepSize={stepSize} />}
      <WalkerSim />
      <EffectComposer>
        <Bloom
          intensity={1.0}
          kernelSize={KernelSize.LARGE}
          luminanceThreshold={0.05}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
