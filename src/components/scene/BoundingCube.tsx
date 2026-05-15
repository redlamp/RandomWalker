"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface BoundingCubeProps {
  bound: number;
  stepSize: number;
}

export function BoundingCube({ bound, stepSize }: BoundingCubeProps) {
  const size = bound * 2 * stepSize;
  const geometry = useMemo(() => new THREE.BoxGeometry(size, size, size), [size]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#39394d" transparent opacity={0.4} />
    </lineSegments>
  );
}
