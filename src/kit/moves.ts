import { Easing, interpolate } from "remotion";

// Small motion helpers for characters. All take scene-relative frames.

/** Upward offset (negative y) for a hop that starts at `at`. */
export function hop(frame: number, fps: number, at: number, height = 70, seconds = 0.45) {
  const t = (frame - at) / (fps * seconds);
  if (t < 0 || t > 1) return 0;
  return -height * Math.sin(Math.PI * t);
}

/** Sum of hops at several frames (nulls ignored), for "hop, hop, hop" or counting. */
export function hops(frame: number, fps: number, at: (number | null)[], height = 60) {
  return at.reduce<number>((y, a) => (a === null ? y : y + hop(frame, fps, a, height)), 0);
}

/** x position walking from `from` to `to` between two frames, easing in and out. */
export function walk(frame: number, from: number, to: number, start: number, end: number) {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
}

/** Little bounce while walking between two frames; 0 outside. */
export function stepBob(frame: number, fps: number, start: number, end: number, height = 14) {
  if (frame < start || frame > end) return 0;
  return -height * Math.abs(Math.sin(((frame - start) / fps) * Math.PI * 2.4));
}
