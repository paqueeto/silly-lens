import React from "react";
import { useCurrentFrame } from "remotion";
import { Felt, Stitch, darker, lighter, rng } from "./felt.tsx";
import { FONT } from "./overlays.tsx";

// Stop-motion plant kit: a procedural monstera leaf (unfurls, splits, opens its
// holes, wilts), stems, pots with roots, a moss pole, and the "cutout" jitter that
// makes every frame look hand-placed.

/**
 * Hand-placed wobble for stop motion: a tiny, different offset on every frame.
 * Wrap each separately-placed piece in its own <Cutout seed>.
 */
export const Cutout: React.FC<{ seed: number; amount?: number; children: React.ReactNode }> = ({ seed, amount = 1, children }) => {
  const frame = useCurrentFrame();
  const r = rng(frame * 7919 + seed * 104729);
  const dx = (r() - 0.5) * 3.2 * amount;
  const dy = (r() - 0.5) * 3.2 * amount;
  const rot = (r() - 0.5) * 0.9 * amount;
  return <g transform={`translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot.toFixed(2)})`}>{children}</g>;
};

type LeafProps = {
  /** Where the leaf joins its stem. */
  x: number;
  y: number;
  /** Length from base to tip. */
  size: number;
  /** Direction the tip points, in degrees (0 = straight up). */
  angle?: number;
  /** 0 rolled up → 1 open. */
  unfurl?: number;
  /** 0 whole leaf → 1 deep splits from the edge. */
  split?: number;
  /** 0 no holes → 1 full fenestrations. */
  holes?: number;
  /** 0 healthy → 1 drooping, curled and dull. */
  wilt?: number;
  color?: string;
  seed?: number;
};

const SLITS = 5;

/**
 * Monstera leaf geometry in leaf space (base at 0,0, tip at 0,-L): the outline, the
 * slit wedges and the holes. Shared by the felt leaf and the sketchbook leaf.
 */
export function monsteraShape(L: number, split: number, holes: number, seed: number) {
  const outline = `M 0 0 C ${-0.22 * L} ${0.14 * L} ${-0.52 * L} ${0.06 * L} ${-0.54 * L} ${-0.34 * L}
    C ${-0.55 * L} ${-0.76 * L} ${-0.22 * L} ${-1.0 * L} 0 ${-1.05 * L}
    C ${0.22 * L} ${-1.0 * L} ${0.55 * L} ${-0.76 * L} ${0.54 * L} ${-0.34 * L}
    C ${0.52 * L} ${0.06 * L} ${0.22 * L} ${0.14 * L} 0 0 Z`;
  const halfWidth = (yy: number) => 0.54 * L * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, (-yy + 0.08 * L) / (1.12 * L)))), 0.75);
  const r = rng(seed);
  const slits: string[] = [];
  const holesList: { cx: number; cy: number; rx: number; ry: number }[] = [];
  for (let k = 0; k < SLITS; k++) {
    const yy = -0.2 * L - k * 0.165 * L;
    const w = halfWidth(yy);
    for (const side of [-1, 1]) {
      // A wedge that follows the vein: wide at the edge, tapering to a point near the midrib,
      // rising towards the tip as it goes out.
      const depth = split * (0.62 + r() * 0.18);
      const ix = side * (w - w * depth);
      const iy = yy + 0.05 * L;
      const ex = side * (w + 10);
      const ey = yy - 0.1 * L * depth;
      const gap = 0.045 * L * split;
      const mx = (ix + ex) / 2;
      const my = (iy + ey) / 2 + 0.03 * L;
      slits.push(`M ${ix} ${iy} Q ${mx} ${my - gap * 0.5} ${ex} ${ey - gap} L ${ex} ${ey + gap} Q ${mx} ${my + gap * 0.5} ${ix} ${iy} Z`);
      if (holes > 0 && k < SLITS - 1) {
        holesList.push({ cx: side * (0.13 + r() * 0.04) * L, cy: yy - 0.1 * L, rx: 0.024 * L * holes, ry: 0.045 * L * holes });
      }
    }
  }
  return { outline, slits, holes: holesList, halfWidth };
}

/** One monstera leaf: heart-shaped, with slits and holes cut by a mask, then felted. */
export const MonsteraLeaf: React.FC<LeafProps> = ({
  x,
  y,
  size: L,
  angle = 0,
  unfurl = 1,
  split = 1,
  holes = 1,
  wilt = 0,
  color = "#2f8f5b",
  seed = 1,
}) => {
  if (unfurl <= 0.01) return null;
  const id = `leaf-${seed}-${Math.round(x)}-${Math.round(y)}`;
  const c = wilt > 0 ? mixColor(color, "#8a8f5a", wilt * 0.7) : color;
  const droop = wilt * 55 * Math.sign(angle || 1);
  const open = 0.12 + 0.88 * unfurl;
  const { outline, slits, holes: holesList, halfWidth } = monsteraShape(L, split, holes, seed);
  const curl = wilt * 0.35;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle + droop}) scale(${open * (1 - curl)} ${1 - wilt * 0.12})`}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-L} y={-1.3 * L} width={2 * L} height={1.6 * L}>
          <path d={outline} fill="#ffffff" />
          {split > 0.02 ? slits.map((d, i) => <path key={i} d={d} fill="#000000" stroke="#000000" strokeWidth={3} strokeLinejoin="round" />) : null}
          {holesList.map((h, i) => (
            <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#000000" transform={`rotate(${h.cx > 0 ? 25 : -25} ${h.cx} ${h.cy})`} />
          ))}
        </mask>
      </defs>
      <Felt>
        <g mask={`url(#${id})`}>
          <path d={outline} fill={c} />
          <path d={`M 0 ${-0.02 * L} Q ${0.03 * L} ${-0.5 * L} 0 ${-1.0 * L}`} stroke={lighter(c, 0.25)} strokeWidth={0.02 * L} fill="none" />
          {Array.from({ length: SLITS }, (_, k) => {
            const yy = -0.12 * L - k * 0.165 * L;
            return (
              <g key={k}>
                <path d={`M 0 ${yy + 0.05 * L} Q ${-0.25 * L} ${yy} ${-halfWidth(yy) * 0.9} ${yy - 0.08 * L}`} stroke={lighter(c, 0.15)} strokeWidth={0.008 * L} fill="none" />
                <path d={`M 0 ${yy + 0.05 * L} Q ${0.25 * L} ${yy} ${halfWidth(yy) * 0.9} ${yy - 0.08 * L}`} stroke={lighter(c, 0.15)} strokeWidth={0.008 * L} fill="none" />
              </g>
            );
          })}
        </g>
        <Stitch d={`M 0 ${-0.06 * L} L 0 ${-0.96 * L}`} color={lighter(c, 0.5)} width={2.2} />
      </Felt>
    </g>
  );
};

function mixColor(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  return "#" + [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * k).toString(16).padStart(2, "0")).join("");
}

/** A curved stem from (x1, y1) to (x2, y2), bowing sideways by `bend`. */
export const Stem: React.FC<{ x1: number; y1: number; x2: number; y2: number; bend?: number; width?: number; color?: string; grow?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  bend = 0,
  width = 14,
  color = "#3f7a4a",
  grow = 1,
}) => {
  if (grow <= 0) return null;
  const ex = x1 + (x2 - x1) * grow;
  const ey = y1 + (y2 - y1) * grow;
  const mx = (x1 + ex) / 2 + bend * grow;
  const my = (y1 + ey) / 2;
  return (
    <Felt>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${ex} ${ey}`} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" />
    </Felt>
  );
};

/** One leaf on its stem, both springing from the plant's base point. */
export type LeafSpec = { angle: number; reach: number; size: number; bend?: number; seed: number };

/**
 * A whole monstera from one base point: each leaf grows its stem, then unfurls.
 * `grow[i]` (0 → 1) drives leaf i; the shared params set the plant's health.
 */
export const Monstera: React.FC<{
  x: number;
  y: number;
  leaves: LeafSpec[];
  grow: number[];
  split?: number;
  holes?: number;
  wilt?: number;
  color?: string;
  scale?: number;
}> = ({ x, y, leaves, grow, split = 1, holes = 1, wilt = 0, color = "#2f8f5b", scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {leaves.map((lf, i) => {
      const g = Math.max(0, Math.min(1, grow[i] ?? 0));
      if (g <= 0) return null;
      const stemGrow = Math.min(1, g * 1.6);
      const unfurl = Math.max(0, (g - 0.4) / 0.6);
      const a = ((lf.angle + wilt * 30 * Math.sign(lf.angle || 1)) * Math.PI) / 180;
      const reach = lf.reach * (1 - wilt * 0.25);
      const tx = Math.sin(a) * reach;
      const ty = -Math.cos(a) * reach;
      return (
        <Cutout key={i} seed={lf.seed} amount={0.8}>
          <Stem x1={0} y1={0} x2={tx} y2={ty} bend={lf.bend ?? lf.angle * 1.2} grow={stemGrow} color={wilt > 0.3 ? "#6f7a4a" : "#3f7a4a"} />
          {stemGrow >= 1 ? (
            <MonsteraLeaf x={tx} y={ty} size={lf.size} angle={lf.angle * 1.15} unfurl={unfurl} split={split} holes={holes} wilt={wilt} color={i % 2 ? color : darker(color, 0.08)} seed={lf.seed} />
          ) : null}
        </Cutout>
      );
    })}
  </g>
);

/**
 * Terracotta pot; (x, y) is the soil line centre. `squeeze` 0 → 1 pinches it in on
 * a beat ("too tight"); `roots` 0 → 1 draws tangled roots in a cutaway window.
 */
export const Pot: React.FC<{ x: number; y: number; w?: number; h?: number; color?: string; squeeze?: number; roots?: number; crack?: number }> = ({
  x,
  y,
  w = 260,
  h = 230,
  color = "#c9683f",
  squeeze = 0,
  roots = 0,
  crack = 0,
}) => {
  const sw = w * (1 - 0.06 * squeeze);
  const top = y - 16;
  const body = `M ${x - sw / 2} ${top + 40} L ${x - sw * 0.38} ${top + h} L ${x + sw * 0.38} ${top + h} L ${x + sw / 2} ${top + 40} Z`;
  const rim = { x: x - sw / 2 - 16, y: top, w: sw + 32, h: 46 };
  const r = rng(77);
  const rootPaths = Array.from({ length: 9 }, (_, i) => {
    const sx = x - sw * 0.3 + (i / 8) * sw * 0.6;
    let d = `M ${sx} ${top + 50}`;
    let px = sx;
    let py = top + 50;
    for (let k = 0; k < 6; k++) {
      px += (r() - 0.5) * sw * 0.35;
      py += (h - 70) / 6;
      d += ` Q ${px + (r() - 0.5) * 60} ${py - 20} ${px} ${py}`;
    }
    return d;
  });
  return (
    <g>
      <Felt>
        <path d={body} fill={color} />
        <rect x={rim.x} y={rim.y} width={rim.w} height={rim.h} rx={10} fill={darker(color, 0.06)} />
        <Stitch d={`M ${rim.x + 14} ${rim.y + 23} H ${rim.x + rim.w - 14}`} color={lighter(color, 0.4)} />
        <ellipse cx={x} cy={top + 6} rx={sw / 2 + 4} ry={12} fill="#4a3426" />
      </Felt>
      {roots > 0 ? (
        <g opacity={Math.min(1, roots * 2)}>
          <clipPath id={`pot-clip-${Math.round(x)}`}>
            <path d={body} />
          </clipPath>
          <g clipPath={`url(#pot-clip-${Math.round(x)})`}>
            <rect x={x - sw / 2} y={top + 46} width={sw} height={h} fill="#5a3b28" opacity={0.92} />
            {rootPaths.map((d, i) => (
              <path key={i} d={d} stroke="#e8d3a8" strokeWidth={4} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, roots * 1.2 - i * 0.03)} />
            ))}
          </g>
        </g>
      ) : null}
      {crack > 0 ? (
        <path
          d={`M ${x - 20} ${top + 46} L ${x + 10} ${top + 90} L ${x - 15} ${top + 130} L ${x + 20} ${top + 170} L ${x} ${top + h}`}
          stroke="#2a1a14"
          strokeWidth={5}
          fill="none"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - crack}
        />
      ) : null}
    </g>
  );
};

/** Moss pole for the plant to climb. `grow` 0 → 1 raises it. */
export const MossPole: React.FC<{ x: number; y: number; height: number; grow?: number }> = ({ x, y, height, grow = 1 }) => {
  if (grow <= 0) return null;
  const h = height * grow;
  return (
    <Felt>
      <rect x={x - 22} y={y - h} width={44} height={h} rx={20} fill="#6b5a3a" />
      {Array.from({ length: Math.floor(h / 40) }, (_, i) => (
        <ellipse key={i} cx={x + (i % 2 ? 10 : -10)} cy={y - 20 - i * 40} rx={18} ry={10} fill="#7d8f4a" />
      ))}
    </Felt>
  );
};

/** A gold felt crown. (x, y) is the band's bottom centre. */
export const Crown: React.FC<{ x: number; y: number; size?: number; pop?: number; tilt?: number }> = ({ x, y, size = 1, pop = 1, tilt = -8 }) => {
  if (pop <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${size * pop})`}>
      <Felt>
        <path d="M -90 0 L -100 -90 L -50 -45 L 0 -110 L 50 -45 L 100 -90 L 90 0 Z" fill="#f2b72e" strokeLinejoin="round" stroke="#f2b72e" strokeWidth={8} />
        <circle cx={-100} cy={-92} r={13} fill="#e05a6d" />
        <circle cx={0} cy={-112} r={15} fill="#5bb39b" />
        <circle cx={100} cy={-92} r={13} fill="#e05a6d" />
        <Stitch d="M -84 -14 H 84" color="#ffe9a6" />
      </Felt>
    </g>
  );
};

/** A water drop. */
export const Drop: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    <Felt>
      <path d="M 0 -40 C 18 -14 26 0 26 12 A 26 26 0 1 1 -26 12 C -26 0 -18 -14 0 -40 Z" fill="#6cc4e8" />
    </Felt>
  </g>
);

/**
 * Felt cut-out word that builds letter by letter (one letter per `step` frames from
 * `at`), each letter placed slightly off like hand-set type.
 */
export const CutoutWord: React.FC<{ text: string; x: number; y: number; size?: number; color?: string; at: number; step?: number; seed?: number; anchor?: "middle" | "start" }> = ({
  text,
  x,
  y,
  size = 140,
  color = "#fff3d6",
  at,
  step = 2,
  seed = 1,
  anchor = "middle",
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const letters = [...text];
  const advance = (ch: string) => size * (ch === " " ? 0.32 : /[IJLijl1!.,']/.test(ch) ? 0.34 : /[MWmw]/.test(ch) ? 0.82 : 0.62);
  const width = letters.reduce((w, ch) => w + advance(ch), 0);
  let cx = anchor === "middle" ? x - width / 2 : x;
  const r = rng(seed * 31);
  return (
    <g>
      {letters.map((ch, i) => {
        const w = advance(ch);
        const lx = cx + w / 2;
        cx += w;
        const rot = (r() - 0.5) * 12;
        const dy = (r() - 0.5) * size * 0.08;
        if (ch === " " || frame < at + i * step) return null;
        return (
          <Cutout key={i} seed={seed * 100 + i} amount={0.6}>
            <g transform={`translate(${lx} ${y + dy}) rotate(${rot})`}>
              <Felt>
                <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={color}>
                  {ch}
                </text>
              </Felt>
            </g>
          </Cutout>
        );
      })}
    </g>
  );
};
