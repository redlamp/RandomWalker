"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore, type ViewSide } from "@/store/sim-store";

interface Face {
  side: ViewSide;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  label: string;
}

const FACES: Face[] = [
  { side: "+x", position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0], color: "#ef4f4f", label: "+X" },
  { side: "-x", position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0], color: "#8a2a2a", label: "-X" },
  { side: "+y", position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0], color: "#4fef4f", label: "+Y" },
  { side: "-y", position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0], color: "#2a8a2a", label: "-Y" },
  { side: "+z", position: [0, 0, 0.51], rotation: [0, 0, 0], color: "#4f8aef", label: "+Z" },
  { side: "-z", position: [0, 0, -0.51], rotation: [0, Math.PI, 0], color: "#2a4a8a", label: "-Z" },
];

function GizmoCamera() {
  const cameraDir = useSimStore((s) => s.cameraDir);
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    tmp.current.set(cameraDir[0], cameraDir[1], cameraDir[2]).normalize().multiplyScalar(3);
    camera.position.copy(tmp.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function FacePlane({ face, onPick }: { face: Face; onPick: (side: ViewSide) => void }) {
  const hovered = useRef(false);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  return (
    <mesh
      position={face.position}
      rotation={face.rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        if (matRef.current) matRef.current.opacity = 1.0;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        if (matRef.current) matRef.current.opacity = 0.85;
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onPick(face.side);
      }}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={matRef}
        color={face.color}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CubeEdges() {
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
      <lineBasicMaterial color="#ffffff" transparent opacity={0.4} />
    </lineSegments>
  );
}

function GizmoScene({ onPick }: { onPick: (side: ViewSide) => void }) {
  return (
    <>
      <GizmoCamera />
      <ambientLight intensity={1} />
      <CubeEdges />
      {FACES.map((f) => (
        <FacePlane key={f.side} face={f} onPick={onPick} />
      ))}
    </>
  );
}

export function CameraGizmo() {
  const requestSnap = useSimStore((s) => s.requestSnap);

  return (
    <div className="h-24 w-full">
      <Canvas
        camera={{ fov: 30, position: [3, 3, 3], near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <GizmoScene onPick={requestSnap} />
      </Canvas>
    </div>
  );
}
