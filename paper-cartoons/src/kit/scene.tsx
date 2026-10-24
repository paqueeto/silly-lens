import React, { createContext, useContext } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { findWordTimes, normalizeWord } from "../timing.ts";
import type { SceneTime } from "../types.ts";
import { H, W } from "./felt.tsx";

// Every scene component runs inside a <Sequence>, so useCurrentFrame() starts
// at 0 when the scene starts. useScene() tells it when each word is spoken,
// which is how actions land on the voice.

type SceneInfo = {
  scene: SceneTime;
  /** Frames in this scene. */
  duration: number;
};

export const SceneContext = createContext<SceneInfo | null>(null);

export function useScene() {
  const info = useContext(SceneContext);
  const { fps } = useVideoConfig();
  if (!info) throw new Error("useScene() must be used inside a story scene");
  const toFrame = (seconds: number) => Math.round((seconds - info.scene.start) * fps);

  return {
    duration: info.duration,
    fps,
    /** Frame (scene-relative) when the n-th occurrence of `word` starts, or fallback. */
    word(word: string, n = 0, fallback = 0): number {
      const want = normalizeWord(word);
      const hits = info.scene.lines.flatMap((l) => l.words).filter((w) => normalizeWord(w.w) === want);
      const hit = hits[n];
      return hit ? toFrame(hit.start) : fallback;
    },
    /** Frame when line i starts / ends. */
    lineStart: (i: number) => toFrame(info.scene.lines[i]?.start ?? info.scene.start),
    lineEnd: (i: number) => toFrame(info.scene.lines[i]?.end ?? info.scene.end),
    /** Frames for words listed in order (same matching as `pop`). */
    words: (list: string[]) => findWordTimes(info.scene, list).map((w) => (w ? toFrame(w.start) : null)),
    seconds: (s: number) => Math.round(s * fps),
  };
}

/** 0 → 1 springy entrance starting at `at`. */
export function usePop(at: number, damping = 12) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, mass: 0.7, stiffness: 110 } });
}

/** Smooth 0 → 1 between two frames. */
export function ramp(frame: number, from: number, to: number, ease = Easing.inOut(Easing.cubic)) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
}

/** Gentle repeating wobble, for idle life. */
export const wobble = (frame: number, fps: number, period = 3, phase = 0) =>
  Math.sin(((frame / fps) * Math.PI * 2) / period + phase);

export type CameraMove = "still" | "push" | "pull" | "drift-left" | "drift-right" | "rise" | "sink";

type CameraProps = {
  move?: CameraMove;
  /** Point the push/pull centres on. */
  focus?: [number, number];
  amount?: number;
  /** Frame of a big moment to shake on. */
  shakeAt?: number;
  children: React.ReactNode;
};

/** Slow camera on the whole scene. Wrap the scene's <svg> contents in it. */
export const Camera: React.FC<CameraProps> = ({ move = "push", focus = [W / 2, H / 2], amount = 1, shakeAt, children }) => {
  const frame = useCurrentFrame();
  const { duration, fps } = useScene();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let scale = 1.04;
  let tx = 0;
  let ty = 0;
  if (move === "push") scale = 1.03 + 0.09 * amount * p;
  if (move === "pull") scale = 1.12 - 0.09 * amount * p;
  if (move === "drift-left") tx = 50 * amount * (0.5 - p) * 2;
  if (move === "drift-right") tx = -50 * amount * (0.5 - p) * 2;
  if (move === "rise") ty = 60 * amount * (p - 0.5) * 2;
  if (move === "sink") ty = -60 * amount * (p - 0.5) * 2;
  if (shakeAt !== undefined && frame >= shakeAt && frame < shakeAt + fps * 0.6) {
    const k = 1 - (frame - shakeAt) / (fps * 0.6);
    tx += Math.sin(frame * 2.7) * 9 * k;
    ty += Math.cos(frame * 3.1) * 6 * k;
  }
  const [fx, fy] = focus;
  return (
    <g transform={`translate(${tx} ${ty}) translate(${fx} ${fy}) scale(${scale}) translate(${-fx} ${-fy})`}>
      {children}
    </g>
  );
};

/** Full-frame SVG stage for a scene. */
export const Stage: React.FC<{ children: React.ReactNode; background?: string }> = ({ children, background = "#1d2147" }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, background }}>
    {children}
  </svg>
);
