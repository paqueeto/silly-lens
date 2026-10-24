import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Felt, H, Stitch, W, lighter, rng } from "./felt.tsx";
import { HangingStar } from "./nature.tsx";
import type { Mood } from "../types.ts";

export const FONT = "Fredoka, 'Baloo 2', 'Comic Neue', sans-serif";

type PopWord = { word: string; frame: number };

/**
 * Story words on felt tags, popping in the moment the narrator says them.
 * Frames are relative to the scene. They gather in a row near the top.
 */
export const WordPops: React.FC<{ words: PopWord[]; duration: number; seed?: number }> = ({ words, duration, seed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rng(seed * 31 + 7);
  const fontSize = 84;
  const widths = words.map((w) => w.word.length * fontSize * 0.56 + 90);
  const gap = 36;
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, words.length - 1);
  let x = W / 2 - total / 2;
  const exit = interpolate(frame, [duration - fps * 0.7, duration - fps * 0.25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const colors = ["#ffd65c", "#f6a6b2", "#9fd8c5", "#b7c4ff", "#ffb979"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      {words.map((w, i) => {
        const width = widths[i];
        const cx = x + width / 2;
        x += width + gap;
        const rot = (r() - 0.5) * 10;
        const color = colors[(i + seed) % colors.length];
        if (frame < w.frame) return null;
        const s = spring({ frame: frame - w.frame, fps, config: { damping: 9, stiffness: 140, mass: 0.6 } });
        const float = 5 * Math.sin((frame / fps) * 2 + i);
        const cy = 170 + float + (i % 2) * 18;
        const h = fontSize * 1.35;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot * s}) scale(${s * exit})`} opacity={exit}>
            <Felt>
              <rect x={-width / 2} y={-h / 2} width={width} height={h} rx={28} fill={color} />
              <Stitch d={`M ${-width / 2 + 14} ${-h / 2 + 14} h ${width - 28} v ${h - 28} h ${-(width - 28)} Z`} color={lighter(color, 0.6)} />
            </Felt>
            <text
              x={0}
              y={fontSize * 0.34}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={700}
              fontSize={fontSize}
              fill="#2b2140"
            >
              {w.word}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/** Optional subtitles. Used automatically while the film has no narration yet. */
export const Caption: React.FC<{ text: string | null }> = ({ text }) =>
  text ? (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 56 }}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 46,
          color: "#fffaf0",
          background: "rgba(20, 16, 40, 0.55)",
          padding: "14px 34px",
          borderRadius: 999,
          maxWidth: 1500,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  ) : null;

function tornEdge(x: number, seed: number, dir: 1 | -1) {
  const r = rng(seed);
  const pts: string[] = [];
  for (let y = -20; y <= H + 20; y += 36) pts.push(`${x + dir * r() * 34} ${y}`);
  return pts;
}

/**
 * Torn-paper wipe. It fully covers the frame at `at`, which is where the
 * scene cut happens, so the cut is never seen.
 */
export const PaperWipe: React.FC<{ at: number; seed?: number; color?: string }> = ({ at, seed = 1, color = "#f4e6c8" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const half = Math.round(fps * 0.5);
  if (frame < at - half || frame > at + half) return null;
  const sheet = W + 360;
  const x = interpolate(frame, [at - half, at + half], [W + 20, -sheet - 20], {
    easing: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  });
  const left = tornEdge(0, seed, -1);
  const right = tornEdge(sheet, seed + 1, 1).reverse();
  const d = `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
  const second = lighter(color, 0.35);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x + 60} 0)`} filter="url(#paper)">
        <path d={d} fill="#e5a87d" />
      </g>
      <g transform={`translate(${x} 0)`} filter="url(#paper)">
        <path d={d} fill={color} />
        <path d={d} fill={second} opacity={0.35} transform="translate(40 0) scale(0.96 1)" />
      </g>
    </svg>
  );
};

/** A row of dangling stars along the top of a card. */
const HangingStarRow: React.FC<{ seed: number; mood: Mood }> = ({ seed, mood }) => {
  const r = rng(seed);
  const colors = mood === "bedtime" ? ["#ffd65c", "#fff1b0", "#ffc94a"] : ["#e8664a", "#5bb39b", "#f2b33d", "#7a8be0"];
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <HangingStar
          key={i}
          x={150 + i * 232 + (r() - 0.5) * 60}
          length={90 + r() * 170}
          size={26 + r() * 16}
          color={colors[i % colors.length]}
          lit={mood === "bedtime" ? 0.6 : 0}
          seed={seed + i}
        />
      ))}
    </g>
  );
};

const palette = (mood: Mood) =>
  mood === "bedtime"
    ? { bg: "#1f2452", bg2: "#2e3570", ink: "#fff3d6", accent: "#ffd65c" }
    : { bg: "#ffe8b8", bg2: "#ffd38a", ink: "#3a2448", accent: "#e8664a" };

const Card: React.FC<{ mood: Mood; title: string; subtitle?: string; from: number; seed: number }> = ({ mood, title, subtitle, from, seed }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const p = palette(mood);
  const words = title.split(" ");
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${p.bg2}, ${p.bg})` }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect width={W} height={H} fill="transparent" filter="url(#paper)" />
        <HangingStarRow seed={seed} mood={mood} />
      </svg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 28px", maxWidth: 1500 }}>
          {words.map((w, i) => {
            const s = spring({ frame: frame - 8 - i * 5, fps, config: { damping: 10, stiffness: 120 } });
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 132,
                  color: p.ink,
                  display: "inline-block",
                  transform: `translateY(${(1 - s) * 60}px) scale(${0.6 + 0.4 * s}) rotate(${(i % 2 ? 2 : -2) * s}deg)`,
                  opacity: s,
                  textShadow: "0 6px 0 rgba(0,0,0,0.18)",
                  lineHeight: 1.1,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
        {subtitle ? (
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 48,
              color: p.accent,
              opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const TitleCard: React.FC<{ title: string; mood: Mood }> = ({ title, mood }) => <Card mood={mood} title={title} from={0} seed={3} />;

export const EndCard: React.FC<{ mood: Mood; from: number }> = ({ mood, from }) => (
  <Card mood={mood} title="The End" subtitle={mood === "bedtime" ? "Sweet dreams" : "See you next time!"} from={from} seed={8} />
);

/** Placeholder for a scene that is in the story but not built yet. */
export const MissingScene: React.FC<{ id: string; lines: string[] }> = ({ id, lines }) => (
  <AbsoluteFill style={{ background: "#2b2f4f", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 20, padding: 120 }}>
    <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 700, color: "#ffd65c" }}>Scene “{id}” not built yet</div>
    {lines.map((l, i) => (
      <div key={i} style={{ fontFamily: FONT, fontSize: 38, color: "#fff3d6", textAlign: "center" }}>
        {l}
      </div>
    ))}
  </AbsoluteFill>
);
