import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Felt, FeltEllipse, Stitch, darker, ellipsePath, lighter } from "./felt.tsx";
import { FONT } from "./overlays.tsx";
import { wobble } from "./scene.tsx";

// Pieces for learning videos: felt numbers, hands that count on their fingers,
// paw prints, a felt board, and karaoke lyrics.

type FeltNumberProps = {
  n: number | string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  /** 0 → 1 entrance. */
  pop?: number;
  /** Extra scale for a beat (0 = none, 1 = +15%). */
  pulse?: number;
  /** Word under the number, e.g. "uno". */
  word?: string;
  /** Smaller second-language gloss under the word, e.g. "one". */
  gloss?: string;
  glow?: boolean;
};

/**
 * A big felt numeral (or short word) with its word underneath. (x, y) is the
 * numeral's centre. Below 130 px the ragged felt edge is skipped so it stays legible.
 */
export const FeltNumber: React.FC<FeltNumberProps> = ({
  n,
  x,
  y,
  size = 280,
  color = "#ff8a5b",
  pop = 1,
  pulse = 0,
  word,
  gloss,
  glow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (pop <= 0) return null;
  const s = pop * (1 + 0.15 * pulse);
  const tilt = 3 * wobble(frame, fps, 3.2);
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      {glow ? (
        <>
          <defs>
            <radialGradient id="felt-number-glow">
              <stop offset="0" stopColor="#fff3b0" stopOpacity={0.55} />
              <stop offset="1" stopColor="#fff3b0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={0} cy={0} r={size * 0.75} fill="url(#felt-number-glow)" />
        </>
      ) : null}
      <Felt flat={size < 130}>
        <text
          x={0}
          y={size * 0.36}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={size}
          fill={color}
          stroke={darker(color, 0.12)}
          strokeWidth={size * 0.02}
          strokeLinejoin="round"
        >
          {n}
        </text>
        <text
          x={0}
          y={size * 0.36}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={size}
          fill="none"
          stroke={lighter(color, 0.55)}
          strokeWidth={size * 0.012}
          strokeDasharray={`${size * 0.03} ${size * 0.026}`}
          transform={`scale(0.94) translate(0 ${size * 0.012})`}
        >
          {n}
        </text>
      </Felt>
      {word ? (
        <text x={0} y={size * 0.72} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size * 0.26} fill="#ffffff" stroke="#2b2140" strokeWidth={size * 0.035} paintOrder="stroke">
          {word}
        </text>
      ) : null}
      {gloss ? (
        <text x={0} y={size * 0.92} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={size * 0.15} fill="#fff3d6" stroke="#2b2140" strokeWidth={size * 0.025} paintOrder="stroke">
          {gloss}
        </text>
      ) : null}
    </g>
  );
};

const SKIN = "#f4c7a1";

/** Finger raise order when counting: index, middle, ring, pinky, thumb. */
const FINGERS = [
  { dx: -48, len: 150, w: 40, angle: -8 },
  { dx: -2, len: 165, w: 42, angle: 0 },
  { dx: 44, len: 150, w: 40, angle: 7 },
  { dx: 84, len: 118, w: 36, angle: 15 },
];

type HandProps = {
  x: number;
  y: number;
  size?: number;
  /** One value per finger in counting order (index, middle, ring, pinky, thumb): 0 folded → 1 raised. */
  fingers: number[];
  color?: string;
  flip?: boolean;
  rotate?: number;
  /** Little number tags on raised fingers. */
  labels?: boolean;
  pop?: number;
};

/** A felt hand counting on its fingers. (x, y) is the wrist; it points up. */
export const FeltHand: React.FC<HandProps> = ({ x, y, size = 1, fingers, color = SKIN, flip = false, rotate = 0, labels = false, pop = 1 }) => {
  if (pop <= 0) return null;
  const f = (i: number) => Math.max(0, Math.min(1, fingers[i] ?? 0));
  const thumb = f(4);
  const stitch = lighter(color, 0.5);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${(flip ? -1 : 1) * size * pop} ${size * pop})`}>
      <Felt>
        {/* sleeve */}
        <rect x={-95} y={-10} width={190} height={70} rx={20} fill="#6c8fd6" />
        <Stitch d="M -80 6 H 80" color="#b9c9f0" />
        {FINGERS.map((fg, i) => {
          const raise = f(i);
          const len = 40 + (fg.len - 40) * raise;
          const baseY = -150;
          return (
            <g key={i} transform={`rotate(${fg.angle * raise} ${fg.dx} ${baseY})`}>
              <rect x={fg.dx - fg.w / 2} y={baseY - len} width={fg.w} height={len + 40} rx={fg.w / 2} fill={color} />
              {raise > 0.5 ? <Stitch d={`M ${fg.dx} ${baseY - len + 22} V ${baseY - 6}`} color={stitch} width={2} /> : null}
            </g>
          );
        })}
        {/* palm */}
        <rect x={-92} y={-175} width={196} height={180} rx={70} fill={color} />
        <Stitch d={`M -70 -150 Q 6 -170 80 -150`} color={stitch} width={2} />
        {/* thumb: tucked across the palm, or out to the side */}
        <g transform={`rotate(${-55 * thumb} -80 -60)`}>
          <rect x={-130 + 40 * (1 - thumb)} y={-120} width={44} height={100} rx={22} fill={darker(color, 0.04)} transform={`rotate(${-35 + 35 * thumb} -108 -70)`} />
        </g>
      </Felt>
      {labels
        ? [0, 1, 2, 3, 4].map((i) => {
            // A tidy 1-2-3-4-5 row above the hand, one tag per raised finger.
            if (f(i) < 0.6) return null;
            return (
              <g key={i} transform={`scale(${flip ? -1 : 1} 1) translate(${-130 + i * 65} -390)`}>
                <circle r={26} fill="#ffd65c" stroke="#2b2140" strokeWidth={3} />
                <text y={11} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill="#2b2140">
                  {i + 1}
                </text>
              </g>
            );
          })
        : null}
    </g>
  );
};

/** One felt paw print. `stamp` 0 → 1 presses it in. */
export const PawPrint: React.FC<{ x: number; y: number; size?: number; color?: string; stamp?: number; rotate?: number; label?: number }> = ({
  x,
  y,
  size = 1,
  color = "#7a5a8c",
  stamp = 1,
  rotate = 0,
  label,
}) => {
  if (stamp <= 0) return null;
  const s = size * (1.4 - 0.4 * stamp);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`} opacity={Math.min(1, stamp * 1.5)}>
      <Felt>
        <ellipse cx={0} cy={18} rx={34} ry={28} fill={color} />
        <FeltEllipse cx={-38} cy={-22} rx={13} ry={17} fill={color} stitch={false} />
        <FeltEllipse cx={-13} cy={-40} rx={13} ry={17} fill={color} stitch={false} />
        <FeltEllipse cx={13} cy={-40} rx={13} ry={17} fill={color} stitch={false} />
        <FeltEllipse cx={38} cy={-22} rx={13} ry={17} fill={color} stitch={false} />
        <Stitch d={ellipsePath(0, 18, 24, 18)} color={lighter(color, 0.45)} width={2} />
      </Felt>
      {label !== undefined ? (
        <g transform={`rotate(${-rotate}) translate(0 -88)`}>
          <circle r={24} fill="#ffd65c" stroke="#2b2140" strokeWidth={3} />
          <text y={10} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={30} fill="#2b2140">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** A big felt board with a stitched border, for review and quiz scenes. */
export const FeltBoard: React.FC<{ color?: string; frameColor?: string }> = ({ color = "#3f7f6e", frameColor = "#b98552" }) => (
  <>
    <rect x={-100} y={-100} width={2120} height={1280} fill="#f3e3c3" filter="url(#paper)" />
    <Felt>
      <rect x={70} y={70} width={1780} height={900} rx={46} fill={frameColor} />
      <rect x={110} y={110} width={1700} height={820} rx={30} fill={color} />
      <Stitch d="M 140 140 H 1780 V 900 H 140 Z" color={lighter(color, 0.4)} />
    </Felt>
  </>
);

/** A small felt music note, for "la la la". */
export const MusicNote: React.FC<{ x: number; y: number; size?: number; color?: string; opacity?: number }> = ({ x, y, size = 1, color = "#ffd65c", opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`} opacity={opacity}>
    <Felt>
      <ellipse cx={0} cy={0} rx={22} ry={16} fill={color} transform="rotate(-20)" />
      <rect x={16} y={-92} width={9} height={92} rx={4} fill={color} />
      <path d="M 25 -92 Q 60 -80 52 -45 Q 46 -70 25 -70 Z" fill={color} />
    </Felt>
  </g>
);

type KaraokeLine = { text: string; start: number; end: number; words: { w: string; start: number; end: number }[] };

/**
 * Sing-along lyrics: the current line at the bottom, each word lighting up as it is
 * sung. `t` is the film time in seconds.
 */
export const Karaoke: React.FC<{ lines: KaraokeLine[]; t: number }> = ({ lines, t }) => {
  const line = lines.find((l) => t >= l.start - 0.35 && t <= l.end + 0.45);
  if (!line) return null;
  const fadeIn = interpolate(t, [line.start - 0.35, line.start - 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(t, [line.end + 0.2, line.end + 0.45], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 46,
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 58,
          padding: "12px 38px",
          borderRadius: 999,
          background: "rgba(30, 22, 54, 0.62)",
          display: "flex",
          gap: 18,
        }}
      >
        {line.words.map((w, i) => {
          const sung = t >= w.start;
          const k = interpolate(t, [w.start, w.start + 0.12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <span
              key={i}
              style={{
                color: sung ? "#ffd65c" : "#fffaf0",
                display: "inline-block",
                transform: `translateY(${-6 * k * (1 - k) * 4}px) scale(${1 + 0.08 * k * (1 - k) * 4})`,
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Music-video lyrics: a lower-third line that adds each word the moment it is sung.
 * Calmer and more grown-up than karaoke. `t` is the film time in seconds.
 */
export const LyricWords: React.FC<{ lines: KaraokeLine[]; t: number; color?: string }> = ({ lines, t, color = "#fffaf0" }) => {
  const line = lines.find((l) => t >= l.start - 0.1 && t <= l.end + 0.9);
  if (!line) return null;
  const out = interpolate(t, [line.end + 0.6, line.end + 0.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 90, bottom: 70, right: 90, opacity: out }}>
      <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "0 16px", padding: "10px 26px", background: "rgba(16, 14, 20, 0.55)", borderRadius: 10 }}>
        {line.words.map((w, i) =>
          t >= w.start ? (
            <span key={i} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 50, color, letterSpacing: 0.5 }}>
              {w.w}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
};
