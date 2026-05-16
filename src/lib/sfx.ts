"use client";

import { useSimStore } from "@/store/sim-store";

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let lastPlayAt = 0;
let unlocked = false;
let unlockWired = false;
const MIN_GAP_MS = 25;
const NOISE_BUFFER_SECONDS = 0.2;

function wireUnlock() {
  if (unlockWired || typeof window === "undefined") return;
  unlockWired = true;
  const onGesture = () => {
    const c = getCtx();
    if (!c) return;
    c.resume()
      .then(() => {
        unlocked = true;
      })
      .catch(() => {});
    if (unlocked) {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    }
  };
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  window.addEventListener("touchstart", onGesture);
}

function rand(center: number, spread: number) {
  return center + (Math.random() * 2 - 1) * spread;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    wireUnlock();
  }
  return ctx;
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const len = Math.floor(NOISE_BUFFER_SECONDS * c.sampleRate);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

export function tryResume(): Promise<void> {
  const c = getCtx();
  if (!c) return Promise.resolve();
  return c.resume().catch(() => {});
}

export function playHomeClick() {
  if (!useSimStore.getState().audioEnabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") return;
  const now = performance.now();
  if (now - lastPlayAt < MIN_GAP_MS) return;
  lastPlayAt = now;

  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = getNoise(c);

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(rand(3400, 900), t);
  filter.Q.value = rand(11, 3);

  const gain = c.createGain();
  const peak = rand(0.09, 0.03);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.07, 0.02));

  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + 0.18);
}
