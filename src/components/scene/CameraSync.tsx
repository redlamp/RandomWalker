"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import { useSimStore, type ViewSide } from "@/store/sim-store";

const ISO_LEN = Math.sqrt(1 + 0.49 + 1);
const ISO_DIR: [number, number, number] = [1 / ISO_LEN, 0.7 / ISO_LEN, 1 / ISO_LEN];

const VIEW_DIRECTIONS: Record<ViewSide, [number, number, number]> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
  default: ISO_DIR,
};

const VIEW_UPS: Record<ViewSide, [number, number, number]> = {
  "+x": [0, 1, 0],
  "-x": [0, 1, 0],
  "+y": [0, 0, -1],
  "-y": [0, 0, 1],
  "+z": [0, 1, 0],
  "-z": [0, 1, 0],
  default: [0, 1, 0],
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

    const dir = camera.position.clone().normalize();
    if (dir.distanceToSquared(lastDir.current) > 1e-6) {
      lastDir.current.copy(dir);
      setCameraDir([dir.x, dir.y, dir.z]);
    }
    if (camera.up.distanceToSquared(lastUp.current) > 1e-6) {
      lastUp.current.copy(camera.up);
      setCameraUp([camera.up.x, camera.up.y, camera.up.z]);
    }
  });

  useEffect(() => {
    if (!snapToView) return;
    const dir = VIEW_DIRECTIONS[snapToView];
    const up = VIEW_UPS[snapToView];
    const radius = camera.position.length() || bound * stepSize * 3.2;
    const oc = controls as unknown as OC;
    setConfig({ cameraAutoOrbit: false });

    const fromDir = camera.position.clone().normalize();
    const toDir = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    const qStart = new THREE.Quaternion();
    const qEnd = new THREE.Quaternion().setFromUnitVectors(fromDir, toDir);
    const qNow = new THREE.Quaternion();
    const posBuf = new THREE.Vector3();

    const fromUp = camera.up.clone();
    const toUp = new THREE.Vector3(up[0], up[1], up[2]);

    const progress = { t: 0 };
    gsap.killTweensOf(progress);
    gsap.to(progress, {
      t: 1,
      duration: 0.7,
      ease: "power2.inOut",
      onUpdate: () => {
        qNow.slerpQuaternions(qStart, qEnd, progress.t);
        posBuf.copy(fromDir).applyQuaternion(qNow).multiplyScalar(radius);
        camera.position.copy(posBuf);
        camera.up.lerpVectors(fromUp, toUp, progress.t);
        camera.lookAt(0, 0, 0);
        if (oc) {
          oc.target.set(0, 0, 0);
          oc.update();
        }
      },
      onComplete: () => {
        camera.up.copy(toUp);
        clearSnap();
      },
    });
  }, [snapToView, camera, controls, bound, stepSize, setConfig, clearSnap]);

  return null;
}
