"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
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

const VIEW_UPS: Record<ViewSide, [number, number, number]> = {
  "+x": [0, 1, 0],
  "-x": [0, 1, 0],
  "+y": [0, 0, -1],
  "-y": [0, 0, 1],
  "+z": [0, 1, 0],
  "-z": [0, 1, 0],
};

type OC = { target: THREE.Vector3; update: () => void } | null;

export function CameraSync() {
  const { camera, controls } = useThree();
  const setCameraDir = useSimStore((s) => s.setCameraDir);
  const setCameraUp = useSimStore((s) => s.setCameraUp);
  const snapToView = useSimStore((s) => s.snapToView);
  const clearSnap = useSimStore((s) => s.clearSnap);
  const setConfig = useSimStore((s) => s.setConfig);
  const bound = useSimStore((s) => s.bound);
  const stepSize = useSimStore((s) => s.stepSize);

  const lastPushed = useRef(0);
  const lastDir = useRef(new THREE.Vector3(0, 0, 0));
  const lastUp = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    const override = useSimStore.getState().gizmoOverride;
    if (override) {
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
      if (camera.up.distanceToSquared(lastUp.current) > 1e-5) {
        lastUp.current.copy(camera.up);
        setCameraUp([camera.up.x, camera.up.y, camera.up.z]);
      }
    }
  });

  useEffect(() => {
    if (!snapToView) return;
    const dir = VIEW_DIRECTIONS[snapToView];
    const up = VIEW_UPS[snapToView];
    const radius = camera.position.length() || bound * stepSize * 3.2;
    const target = {
      x: dir[0] * radius,
      y: dir[1] * radius,
      z: dir[2] * radius,
    };
    const oc = controls as unknown as OC;
    setConfig({ cameraAutoOrbit: false });
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.up);
    gsap.to(camera.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
        if (oc) {
          oc.target.set(0, 0, 0);
          oc.update();
        }
      },
      onComplete: () => {
        clearSnap();
      },
    });
    gsap.to(camera.up, {
      x: up[0],
      y: up[1],
      z: up[2],
      duration: 0.6,
      ease: "power2.inOut",
    });
  }, [snapToView, camera, controls, bound, stepSize, setConfig, clearSnap]);

  return null;
}
