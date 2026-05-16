"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore, type ViewSide } from "@/store/sim-store";

const VIEW_DIRECTIONS: Record<ViewSide, [number, number, number]> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

type OC = { target: THREE.Vector3; update: () => void } | null;

export function CameraSync() {
  const { camera, controls } = useThree();
  const setCameraDir = useSimStore((s) => s.setCameraDir);
  const snapToView = useSimStore((s) => s.snapToView);
  const clearSnap = useSimStore((s) => s.clearSnap);
  const setConfig = useSimStore((s) => s.setConfig);
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);

  const lastPushed = useRef(0);
  const lastDir = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const override = useSimStore.getState().gizmoOverride;
    if (override) {
      // Gizmo is being dragged — adopt its direction at current radius.
      const radius = camera.position.length() || bound * stepSize * 3.2;
      camera.position.set(override[0] * radius, override[1] * radius, override[2] * radius);
      camera.up.set(0, 1, 0);
      camera.lookAt(0, 0, 0);
      const oc = controls as unknown as OC;
      if (oc) {
        oc.target.set(0, 0, 0);
        oc.update();
      }
      return;
    }

    const now = performance.now();
    if (now - lastPushed.current > 120) {
      lastPushed.current = now;
      const dir = camera.position.clone().normalize();
      if (dir.distanceToSquared(lastDir.current) > 1e-5) {
        lastDir.current.copy(dir);
        setCameraDir([dir.x, dir.y, dir.z]);
      }
    }
  });

  useEffect(() => {
    if (!snapToView) return;
    const dir = VIEW_DIRECTIONS[snapToView];
    const dist = bound * stepSize * 3.2;
    camera.position.set(dir[0] * dist, dir[1] * dist, dir[2] * dist);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    const oc = controls as unknown as OC;
    if (oc) {
      oc.target.set(0, 0, 0);
      oc.update();
    }
    setConfig({ cameraAutoOrbit: false });
    clearSnap();
  }, [snapToView, camera, controls, bound, stepSize, setConfig, clearSnap]);

  return null;
}
