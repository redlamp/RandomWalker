"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSimStore } from "@/store/sim-store";

export function Screenshotter() {
  const { gl, scene, camera } = useThree();
  const setScreenshotFn = useSimStore((s) => s.setScreenshotFn);
  const seed = useSimStore((s) => s.seed);

  useEffect(() => {
    const fn = () => {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `random-walker-seed-${seed}-${Date.now()}.png`;
      a.click();
    };
    setScreenshotFn(fn);
    return () => setScreenshotFn(null);
  }, [gl, scene, camera, seed, setScreenshotFn]);

  return null;
}
