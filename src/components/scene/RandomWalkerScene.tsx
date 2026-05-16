"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, OrthographicCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import * as THREE from "three";
import { useSimStore } from "@/store/sim-store";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { WalkerSim } from "./WalkerSim";
import { BoundingCube } from "./BoundingCube";
import { FpsReporter } from "./FpsReporter";
import { Screenshotter } from "./Screenshotter";
import { CameraSync } from "./CameraSync";

function CameraSwapper({
  perspRef,
  orthoRef,
}: {
  perspRef: React.RefObject<THREE.PerspectiveCamera | null>;
  orthoRef: React.RefObject<THREE.OrthographicCamera | null>;
}) {
  const cameraMode = useSimStore((s) => s.cameraMode);
  const { size } = useThree();
  const prevMode = useRef(cameraMode);

  useEffect(() => {
    const persp = perspRef.current;
    const ortho = orthoRef.current;
    if (!persp || !ortho || cameraMode === prevMode.current) {
      prevMode.current = cameraMode;
      return;
    }

    if (cameraMode === "orthographic") {
      ortho.position.copy(persp.position);
      ortho.up.set(0, 1, 0);
      ortho.lookAt(0, 0, 0);
      const d = persp.position.length();
      const canvasH = size.height || 800;
      const fovRad = (persp.fov * Math.PI) / 180;
      const matchedZoom = canvasH / (d * 2 * Math.tan(fovRad / 2));
      ortho.zoom = matchedZoom;
      ortho.updateProjectionMatrix();
    } else {
      persp.position.copy(ortho.position);
      persp.up.set(0, 1, 0);
      persp.lookAt(0, 0, 0);
      persp.updateProjectionMatrix();
    }
    prevMode.current = cameraMode;
  }, [cameraMode, perspRef, orthoRef, size.height]);

  return null;
}

export function RandomWalkerScene() {
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);
  const showBoundingCube = useSimStore((s) => s.showBoundingCube);
  const cameraMode = useSimStore((s) => s.cameraMode);
  const cameraAutoOrbit = useSimStore((s) => s.cameraAutoOrbit);
  const cameraOrbitSpeed = useSimStore((s) => s.cameraOrbitSpeed);
  const worldBackground = useSimStore((s) => s.worldBackground);
  const bloomEnabled = useSimStore((s) => s.bloomEnabled);
  const setConfig = useSimStore((s) => s.setConfig);

  const reducedMotion = useReducedMotion();
  const appliedReducedMotion = useRef(false);
  useEffect(() => {
    if (reducedMotion && !appliedReducedMotion.current) {
      appliedReducedMotion.current = true;
      setConfig({ cameraAutoOrbit: false });
    }
  }, [reducedMotion, setConfig]);

  const camDist = bound * stepSize * 3.2;
  const camPos = useMemo<[number, number, number]>(
    () => {
      const k = camDist / Math.sqrt(3);
      return [k, k, k];
    },
    [camDist],
  );
  const orthoZoom = 30 / Math.max(stepSize, 0.01);

  const perspRef = useRef<THREE.PerspectiveCamera>(null);
  const orthoRef = useRef<THREE.OrthographicCamera>(null);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
        alpha: false,
      }}
      style={{ background: worldBackground, transition: "background-color 400ms ease" }}
    >
      <color attach="background" args={[worldBackground]} />
      <PerspectiveCamera
        ref={perspRef}
        makeDefault={cameraMode === "perspective"}
        position={camPos}
        fov={45}
      />
      <OrthographicCamera
        ref={orthoRef}
        makeDefault={cameraMode === "orthographic"}
        position={camPos}
        zoom={orthoZoom}
        near={-1000}
        far={1000}
      />
      <CameraSwapper perspRef={perspRef} orthoRef={orthoRef} />
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
      <FpsReporter />
      <Screenshotter />
      <CameraSync />
      {bloomEnabled && (
        <EffectComposer>
          <Bloom
            intensity={1.0}
            kernelSize={KernelSize.LARGE}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
