"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useSimStore, type ViewSide } from "@/store/sim-store";

const GIZMO_FPS = 30;
const GIZMO_INTERVAL_MS = 1000 / GIZMO_FPS;

interface Face {
  side: ViewSide;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

const FACES: Face[] = [
  { side: "+x", position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0], color: "#ef4f4f" },
  { side: "-x", position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0], color: "#8a2a2a" },
  { side: "+y", position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0], color: "#4fef4f" },
  { side: "-y", position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0], color: "#2a8a2a" },
  { side: "+z", position: [0, 0, 0.51], rotation: [0, 0, 0], color: "#4f8aef" },
  { side: "-z", position: [0, 0, -0.51], rotation: [0, Math.PI, 0], color: "#2a4a8a" },
];

const HANDLE_OFFSET = 0.78;
const ISO_HANDLE: [number, number, number] = [
  0.5 * HANDLE_OFFSET,
  Math.SQRT1_2 * HANDLE_OFFSET,
  0.5 * HANDLE_OFFSET,
];

const HANDLES: { side: ViewSide; position: [number, number, number]; color: string; radius?: number }[] = [
  { side: "+x", position: [HANDLE_OFFSET, 0, 0], color: "#ff8080" },
  { side: "-x", position: [-HANDLE_OFFSET, 0, 0], color: "#d96060" },
  { side: "+y", position: [0, HANDLE_OFFSET, 0], color: "#80ff80" },
  { side: "-y", position: [0, -HANDLE_OFFSET, 0], color: "#60d960" },
  { side: "+z", position: [0, 0, HANDLE_OFFSET], color: "#80b8ff" },
  { side: "-z", position: [0, 0, -HANDLE_OFFSET], color: "#6090d9" },
  { side: "default", position: ISO_HANDLE, color: "#ffffff", radius: 0.13 },
];

function GizmoCameraMirror() {
  const cameraDir = useSimStore((s) => s.cameraDir);
  const cameraUp = useSimStore((s) => s.cameraUp);
  const { camera } = useThree();
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    if (useSimStore.getState().gizmoOverride) return;
    tmp.current.set(cameraDir[0], cameraDir[1], cameraDir[2]).normalize().multiplyScalar(3);
    camera.position.copy(tmp.current);
    camera.up.set(cameraUp[0], cameraUp[1], cameraUp[2]);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function GizmoDragControls({ dragTickRef }: { dragTickRef: RefObject<number> }) {
  const { camera } = useThree();
  const setGizmoOverride = useSimStore((s) => s.setGizmoOverride);
  const setConfig = useSimStore((s) => s.setConfig);
  const dragging = useRef(false);

  return (
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      enableDamping={false}
      onStart={() => {
        dragging.current = true;
        setConfig({ cameraAutoOrbit: false });
      }}
      onChange={() => {
        if (!dragging.current) return;
        dragTickRef.current += 1;
        const d = camera.position.clone().normalize();
        setGizmoOverride([d.x, d.y, d.z]);
      }}
      onEnd={() => {
        dragging.current = false;
        setGizmoOverride(null);
      }}
    />
  );
}

function FacePlane({
  face,
  onPick,
  dragTickRef,
}: {
  face: Face;
  onPick: (side: ViewSide) => void;
  dragTickRef: RefObject<number>;
}) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const downTick = useRef(0);

  return (
    <mesh
      position={face.position}
      rotation={face.rotation}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        downTick.current = dragTickRef.current;
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (matRef.current) matRef.current.opacity = 1.0;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (matRef.current) matRef.current.opacity = 0.85;
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (dragTickRef.current !== downTick.current) return;
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

function AxisHandle({
  handle,
  onPick,
  dragTickRef,
}: {
  handle: { side: ViewSide; position: [number, number, number]; color: string; radius?: number };
  onPick: (side: ViewSide) => void;
  dragTickRef: RefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const downTick = useRef(0);

  return (
    <mesh
      ref={meshRef}
      position={handle.position}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        downTick.current = dragTickRef.current;
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (matRef.current) matRef.current.opacity = 1.0;
        if (meshRef.current) meshRef.current.scale.setScalar(1.4);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (matRef.current) matRef.current.opacity = 0.85;
        if (meshRef.current) meshRef.current.scale.setScalar(1.0);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (dragTickRef.current !== downTick.current) return;
        onPick(handle.side);
      }}
    >
      <sphereGeometry args={[handle.radius ?? 0.11, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={handle.color} transparent opacity={0.85} />
    </mesh>
  );
}

function CubeEdges() {
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
      <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
    </lineSegments>
  );
}

function GizmoFrameTicker() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), GIZMO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [invalidate]);
  return null;
}

function GizmoScene({ onPick }: { onPick: (side: ViewSide) => void }) {
  const dragTickRef = useRef(0);
  return (
    <>
      <GizmoFrameTicker />
      <GizmoCameraMirror />
      <GizmoDragControls dragTickRef={dragTickRef} />
      <ambientLight intensity={1} />
      <CubeEdges />
      {FACES.map((f) => (
        <FacePlane key={f.side} face={f} onPick={onPick} dragTickRef={dragTickRef} />
      ))}
      {HANDLES.map((h) => (
        <AxisHandle key={`handle-${h.side}`} handle={h} onPick={onPick} dragTickRef={dragTickRef} />
      ))}
    </>
  );
}

export function CameraGizmo() {
  const requestSnap = useSimStore((s) => s.requestSnap);

  return (
    <div className="h-28 w-full cursor-grab active:cursor-grabbing">
      <Canvas
        frameloop="demand"
        camera={{ fov: 35, position: [3, 3, 3], near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <GizmoScene onPick={requestSnap} />
      </Canvas>
    </div>
  );
}
