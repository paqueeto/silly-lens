import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Felt, FeltEllipse, H, Stitch, W, darker, ellipsePath, lighter, mix, rng, smoothPath, starPath, useMaterial } from "./felt.tsx";
import { wobble } from "./scene.tsx";

// Backdrops and props. Coordinates are in the 1920×1080 stage. Everything
// animates from the frame on its own (drifting clouds, rolling waves), so a
// scene only has to place things.

let gradientId = 0;
const useId = (prefix: string) => React.useMemo(() => `${prefix}-${gradientId++}`, [prefix]);

/** Felt-material sky: a felt sheet with wavy felt bands stepping towards the horizon colour. */
const FeltSky: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => {
  const bands = [
    { y: 360, k: 0.2, seed: 3 },
    { y: 580, k: 0.42, seed: 7 },
  ];
  return (
    <g>
      <rect x={-120} y={-120} width={W + 240} height={H + 240} fill={top} filter="url(#felt-heavy-flat)" />
      {bands.map((b) => {
        const r = rng(b.seed);
        const ph = r() * 6;
        const pts: [number, number][] = [];
        const inner: [number, number][] = [];
        for (let x = -160; x <= W + 160; x += 80) {
          const y = b.y + 20 * Math.sin(x / 260 + ph) + 10 * Math.sin(x / 110 + ph * 2);
          pts.push([x, y]);
          inner.push([x, y + 16]);
        }
        const color = mix(top, bottom, b.k);
        return (
          <Felt key={b.y}>
            <path d={`${smoothPath(pts)} L ${W + 160} ${H + 160} L -160 ${H + 160} Z`} fill={color} />
            <Stitch d={smoothPath(inner)} color={lighter(color, 0.35)} />
          </Felt>
        );
      })}
    </g>
  );
};

export const Sky: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => {
  const id = useId("sky");
  const material = useMaterial();
  if (material === "felt") return <FeltSky top={top} bottom={bottom} />;
  return (
    <g filter="url(#paper)">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect x={-120} y={-120} width={W + 240} height={H + 240} fill={`url(#${id})`} />
    </g>
  );
};

/** Little twinkling sparkles scattered over an area. */
export const Sparkles: React.FC<{ count?: number; seed?: number; area?: [number, number, number, number]; color?: string }> = ({
  count = 40,
  seed = 1,
  area = [0, 0, W, H * 0.6],
  color = "#fff6d6",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rng(seed);
  const [x0, y0, w, h] = area;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = x0 + r() * w;
        const y = y0 + r() * h;
        const s = 2 + r() * 4;
        const tw = 0.45 + 0.55 * (0.5 + 0.5 * wobble(frame, fps, 2 + r() * 3, r() * 6));
        return (
          <path
            key={i}
            d={`M ${x} ${y - s * 2} Q ${x} ${y} ${x + s * 2} ${y} Q ${x} ${y} ${x} ${y + s * 2} Q ${x} ${y} ${x - s * 2} ${y} Q ${x} ${y} ${x} ${y - s * 2} Z`}
            fill={color}
            opacity={tw}
          />
        );
      })}
    </g>
  );
};

export const Moon: React.FC<{ x: number; y: number; r?: number; color?: string }> = ({ x, y, r = 90, color = "#f7e8b5" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const halo = 1 + 0.04 * wobble(frame, fps, 5);
  const id = useId("moon");
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0.35" stopColor={color} stopOpacity={0.55} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 3.2 * halo} fill={`url(#${id})`} />
      <Felt>
        <FeltEllipse cx={x} cy={y} rx={r} fill={color} inset={12} />
        <circle cx={x - r * 0.3} cy={y - r * 0.15} r={r * 0.16} fill={darker(color, 0.08)} />
        <circle cx={x + r * 0.28} cy={y + r * 0.3} r={r * 0.11} fill={darker(color, 0.08)} />
        <circle cx={x + r * 0.15} cy={y - r * 0.4} r={r * 0.07} fill={darker(color, 0.08)} />
      </Felt>
    </g>
  );
};

type HangingStarProps = {
  x: number;
  /** Thread length when fully lowered. */
  length: number;
  size?: number;
  color?: string;
  /** 0 = hidden above the frame, 1 = fully lowered. */
  drop?: number;
  /** 0 = felt only, 1 = glowing. */
  lit?: number;
  seed?: number;
  face?: boolean;
};

/** A felt star dangling on a thread from the top of the frame, swaying. */
export const HangingStar: React.FC<HangingStarProps> = ({
  x,
  length,
  size = 38,
  color = "#ffd65c",
  drop = 1,
  lit = 0,
  seed = 1,
  face = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sway = 3.5 * wobble(frame, fps, 3.4 + (seed % 5) * 0.4, seed);
  const len = -size * 2 + (length + size * 2) * drop;
  const cy = len;
  return (
    <g transform={`rotate(${sway} ${x} -20)`}>
      <line x1={x} y1={-20} x2={x} y2={cy - size * 0.9} stroke="#e8e2d0" strokeWidth={2} opacity={0.75} />
      {lit > 0 ? (
        <path d={starPath(x, cy, size * 1.25)} fill="#fff1a8" opacity={0.85 * lit} filter="url(#glow)" />
      ) : null}
      <g transform={`rotate(${sway * 2} ${x} ${cy})`}>
        <Felt>
          <path d={starPath(x, cy, size)} fill={lit > 0.5 ? lighter(color, 0.25) : color} strokeLinejoin="round" stroke={color} strokeWidth={6} />
          <Stitch d={starPath(x, cy, size * 0.68)} color={lighter(color, 0.55)} width={2} />
          {face ? (
            <g>
              <circle cx={x - size * 0.2} cy={cy - size * 0.02} r={size * 0.07} fill="#3a2a1a" />
              <circle cx={x + size * 0.2} cy={cy - size * 0.02} r={size * 0.07} fill="#3a2a1a" />
              <path
                d={`M ${x - size * 0.14} ${cy + size * 0.16} Q ${x} ${cy + size * 0.3} ${x + size * 0.14} ${cy + size * 0.16}`}
                stroke="#3a2a1a"
                strokeWidth={size * 0.06}
                fill="none"
                strokeLinecap="round"
              />
            </g>
          ) : null}
        </Felt>
      </g>
    </g>
  );
};

type CloudProps = { x: number; y: number; w?: number; color?: string; speed?: number; seed?: number; stitch?: boolean };

/** Puffy felt cloud. `speed` is px per second; it wraps around the frame. */
export const Cloud: React.FC<CloudProps> = ({ x, y, w = 320, color = "#e9eef8", speed = 12, seed = 1, stitch = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const span = W + w * 2;
  const cx = ((((x + w + (speed * frame) / fps) % span) + span) % span) - w;
  const r = rng(seed);
  const n = 4;
  const bumps = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const rad = w * (0.17 + 0.1 * Math.sin(t * Math.PI) + r() * 0.04);
    return { x: cx - w / 2 + t * w, y: y - rad * 0.55 - w * 0.06 * Math.sin(t * Math.PI), r: rad };
  });
  const baseH = w * 0.14;
  const stitchColor = lighter(color, 0.6);
  return (
    <Felt>
      <rect x={cx - w / 2} y={y - baseH} width={w} height={baseH * 1.6} rx={baseH * 0.8} fill={color} />
      {bumps.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={color} />
      ))}
      {stitch
        ? bumps.map((b, i) => {
            const rr = b.r - 10;
            const a1 = Math.PI * 1.15;
            const a2 = Math.PI * 1.85;
            return (
              <Stitch
                key={i}
                d={`M ${b.x + Math.cos(a1) * rr} ${b.y + Math.sin(a1) * rr} A ${rr} ${rr} 0 0 1 ${b.x + Math.cos(a2) * rr} ${b.y + Math.sin(a2) * rr}`}
                color={stitchColor}
              />
            );
          })
        : null}
    </Felt>
  );
};

type WaveProps = {
  y: number;
  color: string;
  amp?: number;
  length?: number;
  /** px per second; negative rolls left. */
  speed?: number;
  phase?: number;
};

/** One band of felt sea. Stack 3–4, back to front, darker to lighter. */
export const WaveBand: React.FC<WaveProps> = ({ y, color, amp = 18, length = 260, speed = 30, phase = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shift = ((((speed * frame) / fps + phase) % length) + length) % length;
  const bob = 4 * wobble(frame, fps, 4, phase / 50);
  const pts: [number, number][] = [];
  const pts2: [number, number][] = [];
  // The group shifts by up to one wavelength; a little extra covers camera zoom.
  const x0 = -Math.round(W * 0.1);
  const x1 = Math.round(W * 1.1) + length;
  for (let x = x0; x <= x1 + length / 8; x += length / 8) {
    const k = Math.sin((x / length) * Math.PI * 2);
    pts.push([x, y - amp * k]);
    pts2.push([x, y + 16 - amp * k]);
  }
  const top = smoothPath(pts);
  return (
    <g transform={`translate(${shift - length} ${bob})`}>
      <Felt>
        <path d={`${top} L ${pts[pts.length - 1][0]} ${H + 120} L ${x0} ${H + 120} Z`} fill={color} />
        <Stitch d={smoothPath(pts2)} color={lighter(color, 0.4)} />
      </Felt>
    </g>
  );
};

/** The top edge of `<Hills>` as a function of x, for standing characters on it. */
export function hillCurve(y: number, height = 80, seed = 1) {
  const r = rng(seed);
  const a = [r() * 6, r() * 6, r() * 6];
  return (x: number) =>
    y - height * (0.55 * Math.sin(x / 310 + a[0]) + 0.3 * Math.sin(x / 170 + a[1]) + 0.15 * Math.sin(x / 90 + a[2]));
}

/** Rolling hills along a horizon. */
export const Hills: React.FC<{
  y: number;
  color: string;
  height?: number;
  seed?: number;
  stitch?: boolean;
  stitchColor?: string;
  /** Lighter felt grain, for snow and pale colours. */
  soft?: boolean;
}> = ({ y, color, height = 80, seed = 1, stitch = true, stitchColor, soft }) => {
  const f = hillCurve(y, height, seed);
  const pts: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let x = -100; x <= W + 100; x += 40) {
    pts.push([x, f(x)]);
    inner.push([x, f(x) + 14]);
  }
  return (
    <Felt soft={soft}>
      <path d={`${smoothPath(pts)} L ${W + 100} ${H + 100} L -100 ${H + 100} Z`} fill={color} />
      {stitch ? <Stitch d={smoothPath(inner)} color={stitchColor ?? lighter(color, 0.35)} /> : null}
    </Felt>
  );
};

/** Lollipop tree. (x, y) is where the trunk meets the ground. */
export const RoundTree: React.FC<{ x: number; y: number; size?: number; color?: string; trunk?: string }> = ({
  x,
  y,
  size = 120,
  color = "#3f7a4a",
  trunk = "#6b4a2e",
}) => (
  <Felt>
    <rect x={x - size * 0.09} y={y - size * 1.3} width={size * 0.18} height={size * 1.3} rx={size * 0.05} fill={trunk} />
    <FeltEllipse cx={x} cy={y - size * 1.55} rx={size * 0.62} ry={size * 0.66} fill={color} />
  </Felt>
);

export const PineTree: React.FC<{ x: number; y: number; size?: number; color?: string; snow?: boolean }> = ({
  x,
  y,
  size = 160,
  color = "#2f5d4a",
  snow = false,
}) => {
  const tiers = [0, 1, 2];
  return (
    <Felt>
      <rect x={x - size * 0.05} y={y - size * 0.25} width={size * 0.1} height={size * 0.25} fill="#5a3d26" />
      {tiers.map((i) => {
        const w = size * (0.5 - i * 0.11);
        const top = y - size * (0.55 + i * 0.3);
        const bottom = y - size * (0.2 + i * 0.3);
        const d = `M ${x} ${top} Q ${x + w * 0.2} ${top + 10} ${x + w} ${bottom} Q ${x} ${bottom + 14} ${x - w} ${bottom} Q ${x - w * 0.2} ${top + 10} ${x} ${top} Z`;
        return (
          <g key={i}>
            <path d={d} fill={i % 2 ? lighter(color, 0.06) : color} />
            {snow ? (
              <path
                d={`M ${x} ${top} Q ${x + w * 0.15} ${top + 8} ${x + w * 0.45} ${top + (bottom - top) * 0.45} Q ${x + w * 0.2} ${top + (bottom - top) * 0.38} ${x} ${top + (bottom - top) * 0.5} Q ${x - w * 0.2} ${top + (bottom - top) * 0.38} ${x - w * 0.45} ${top + (bottom - top) * 0.45} Q ${x - w * 0.15} ${top + 8} ${x} ${top} Z`}
                fill="#f6f9ff"
              />
            ) : null}
            <Stitch d={`M ${x - w * 0.75} ${bottom - 6} Q ${x} ${bottom + 6} ${x + w * 0.75} ${bottom - 6}`} color={lighter(color, 0.4)} />
          </g>
        );
      })}
    </Felt>
  );
};

type OakProps = { x: number; ground: number; scale?: number; leaf?: string; bark?: string; branchTo?: number };

/**
 * Big old oak at the side of the frame, with a hollow and a long branch.
 * The branch's top edge runs at y = ground - 470*scale, reaching to x = branchTo.
 */
export const OakTree: React.FC<OakProps> = ({ x, ground, scale = 1, leaf = "#2c5a45", bark = "#6a4a33", branchTo = x + 520 }) => {
  const s = scale;
  const branchY = ground - 470 * s;
  const trunk = `M ${x - 120 * s} ${ground + 40} C ${x - 90 * s} ${ground - 250 * s} ${x - 110 * s} ${ground - 520 * s} ${x - 60 * s} ${ground - 700 * s}
    L ${x + 70 * s} ${ground - 700 * s} C ${x + 90 * s} ${ground - 520 * s} ${x + 80 * s} ${ground - 250 * s} ${x + 130 * s} ${ground + 40} Z`;
  const branch = `M ${x + 40 * s} ${branchY - 10 * s} C ${x + 200 * s} ${branchY - 30 * s} ${branchTo - 160 * s} ${branchY} ${branchTo} ${branchY - 14 * s}
    Q ${branchTo + 22 * s} ${branchY + 4 * s} ${branchTo} ${branchY + 20 * s}
    C ${branchTo - 160 * s} ${branchY + 34 * s} ${x + 200 * s} ${branchY + 30 * s} ${x + 40 * s} ${branchY + 50 * s} Z`;
  const r = rng(9);
  // Back row darker, front row lighter, so the crown reads as layered felt.
  const blobs: [number, number, number, number][] = [
    [-280, -690, 140, 0], [-110, -800, 170, 0], [100, -790, 160, 0], [290, -700, 135, 0],
    [-200, -610, 120, 1], [10, -650, 150, 1], [210, -600, 115, 1], [-330, -560, 90, 1],
    [-30, -870, 105, 2], [160, -700, 85, 2],
  ];
  const shades = [darker(leaf, 0.18), leaf, lighter(leaf, 0.1)];
  const canopy = blobs.map(([dx, dy, rad, k]) => ({
    cx: x + (dx + (r() - 0.5) * 30) * s,
    cy: ground + (dy + (r() - 0.5) * 30) * s,
    r: rad * s,
    fill: shades[k],
  }));
  return (
    <g>
      <Felt>
        <path d={trunk} fill={bark} />
        <Stitch d={`M ${x - 40 * s} ${ground} C ${x - 30 * s} ${ground - 250 * s} ${x - 40 * s} ${ground - 500 * s} ${x - 10 * s} ${ground - 680 * s}`} color={lighter(bark, 0.3)} />
        <path d={branch} fill={bark} />
        <Stitch d={`M ${x + 70 * s} ${branchY + 20 * s} C ${x + 220 * s} ${branchY + 10 * s} ${branchTo - 160 * s} ${branchY + 14 * s} ${branchTo - 20 * s} ${branchY + 4 * s}`} color={lighter(bark, 0.3)} />
        <ellipse cx={x + 5 * s} cy={ground - 300 * s} rx={42 * s} ry={62 * s} fill={darker(bark, 0.55)} />
        <Stitch d={ellipsePath(x + 5 * s, ground - 300 * s, 52 * s, 72 * s)} color={lighter(bark, 0.3)} />
      </Felt>
      <Felt>
        {canopy.map((c, i) => (
          <FeltEllipse key={i} cx={c.cx} cy={c.cy} rx={c.r} fill={c.fill} />
        ))}
        <FeltEllipse cx={branchTo - 30 * s} cy={branchY - 40 * s} rx={46 * s} ry={34 * s} fill={lighter(leaf, 0.1)} />
        <FeltEllipse cx={branchTo - 110 * s} cy={branchY - 30 * s} rx={34 * s} ry={26 * s} fill={leaf} />
      </Felt>
    </g>
  );
};

/** Striped lighthouse with a sweeping beam. (x, y) is the base centre. */
export const Lighthouse: React.FC<{ x: number; y: number; scale?: number; beam?: boolean }> = ({ x, y, scale = 1, beam = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = scale;
  const h = 300 * s;
  const lampY = y - h - 40 * s;
  // Sweeps from level to slightly upward, out over the sea.
  const angle = 190 + 16 * wobble(frame, fps, 9);
  const id = useId("beam");
  const clip = useId("tower");
  const tower = `M ${x - 48 * s} ${y} L ${x - 30 * s} ${y - h} L ${x + 30 * s} ${y - h} L ${x + 48 * s} ${y} Z`;
  return (
    <g>
      {beam ? (
        <g transform={`rotate(${angle} ${x} ${lampY})`}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff3c4" stopOpacity={0.75} />
              <stop offset="1" stopColor="#fff3c4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`M ${x} ${lampY - 10 * s} L ${x + 900 * s} ${lampY - 110 * s} L ${x + 900 * s} ${lampY + 110 * s} L ${x} ${lampY + 10 * s} Z`} fill={`url(#${id})`} />
        </g>
      ) : null}
      <Felt>
        <defs>
          <clipPath id={clip}>
            <path d={tower} />
          </clipPath>
        </defs>
        <path d={tower} fill="#f4ede0" />
        <g clipPath={`url(#${clip})`}>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x - 60 * s} y={y - h + (40 + i * 90) * s} width={120 * s} height={45 * s} fill="#c8433a" />
          ))}
        </g>
        <rect x={x - 46 * s} y={y - h - 8 * s} width={92 * s} height={14 * s} rx={4 * s} fill="#2e2a3a" />
        <rect x={x - 26 * s} y={y - h - 62 * s} width={52 * s} height={56 * s} rx={6 * s} fill="#ffe9a0" />
        <path d={`M ${x - 36 * s} ${y - h - 60 * s} L ${x} ${y - h - 100 * s} L ${x + 36 * s} ${y - h - 60 * s} Z`} fill="#c8433a" />
        <rect x={x - 14 * s} y={y - 70 * s} width={28 * s} height={70 * s} rx={14 * s} fill="#4a3a5a" />
      </Felt>
      <circle cx={x} cy={lampY} r={30 * s} fill="#fff4b8" opacity={0.9} filter="url(#glow)" />
    </g>
  );
};

/** Little sailboat that bobs and rocks. (x, y) is the waterline centre. */
export const Boat: React.FC<{ x: number; y: number; scale?: number; color?: string; sail?: string }> = ({
  x,
  y,
  scale = 1,
  color = "#b8483e",
  sail = "#f6efe2",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = scale;
  const rock = 4 * wobble(frame, fps, 3.2);
  const bob = 6 * wobble(frame, fps, 2.6, 1);
  return (
    <g transform={`translate(0 ${bob}) rotate(${rock} ${x} ${y})`}>
      <Felt>
        <path d={`M ${x - 90 * s} ${y - 30 * s} L ${x + 90 * s} ${y - 30 * s} Q ${x + 70 * s} ${y + 20 * s} ${x + 40 * s} ${y + 22 * s} L ${x - 40 * s} ${y + 22 * s} Q ${x - 70 * s} ${y + 20 * s} ${x - 90 * s} ${y - 30 * s} Z`} fill={color} />
        <Stitch d={`M ${x - 76 * s} ${y - 18 * s} L ${x + 76 * s} ${y - 18 * s}`} color={lighter(color, 0.45)} />
        <rect x={x - 3 * s} y={y - 190 * s} width={6 * s} height={162 * s} fill="#5a3d26" />
        <path d={`M ${x + 8 * s} ${y - 180 * s} Q ${x + 80 * s} ${y - 100 * s} ${x + 76 * s} ${y - 42 * s} L ${x + 8 * s} ${y - 42 * s} Z`} fill={sail} />
        <path d={`M ${x - 8 * s} ${y - 150 * s} Q ${x - 54 * s} ${y - 90 * s} ${x - 56 * s} ${y - 42 * s} L ${x - 8 * s} ${y - 42 * s} Z`} fill={darker(sail, 0.06)} />
      </Felt>
    </g>
  );
};

/** Rock or small island the lighthouse stands on. */
export const Island: React.FC<{ x: number; y: number; w?: number; color?: string }> = ({ x, y, w = 260, color = "#3b3550" }) => (
  <Felt>
    <path d={`M ${x - w / 2} ${y + 40} Q ${x - w * 0.42} ${y - 30} ${x - w * 0.2} ${y - 46} Q ${x} ${y - 70} ${x + w * 0.22} ${y - 44} Q ${x + w * 0.44} ${y - 28} ${x + w / 2} ${y + 40} Z`} fill={color} />
    <Stitch d={`M ${x - w * 0.36} ${y - 14} Q ${x} ${y - 52} ${x + w * 0.36} ${y - 14}`} color={lighter(color, 0.3)} />
  </Felt>
);

/** Fireflies drifting in loops. */
export const Fireflies: React.FC<{ count?: number; seed?: number; area?: [number, number, number, number] }> = ({
  count = 12,
  seed = 4,
  area = [0, H * 0.4, W, H * 0.5],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rng(seed);
  const [x0, y0, w, h] = area;
  return (
    <g filter="url(#glow)">
      {Array.from({ length: count }, (_, i) => {
        const bx = x0 + r() * w;
        const by = y0 + r() * h;
        const p = r() * 10;
        const x = bx + 40 * wobble(frame, fps, 6 + r() * 4, p);
        const y = by + 25 * wobble(frame, fps, 4 + r() * 3, p + 1);
        const on = 0.35 + 0.65 * Math.max(0, wobble(frame, fps, 2.2 + r(), p));
        return <circle key={i} cx={x} cy={y} r={5} fill="#f5ffa8" opacity={on} />;
      })}
    </g>
  );
};

type BranchProps = {
  from: [number, number];
  to: [number, number];
  thickness?: number;
  color?: string;
  leaf?: string;
  leaves?: number;
};

/** A felt branch for characters to perch on. Its top edge runs from `from` to `to`. */
export const Branch: React.FC<BranchProps> = ({ from, to, thickness = 46, color = "#6a4a33", leaf = "#3d7a55", leaves = 3 }) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const sag = 18;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + sag;
  const top = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const tip = thickness * 0.35;
  const d = `${top} Q ${x2 + tip} ${y2 + tip} ${x2} ${y2 + tip * 1.6} Q ${mx} ${my + thickness * 0.9} ${x1} ${y1 + thickness} Z`;
  const r = rng(Math.round(x1 + y2));
  return (
    <Felt>
      <path d={d} fill={color} />
      <Stitch d={`M ${x1} ${y1 + thickness * 0.4} Q ${mx} ${my + thickness * 0.4} ${x2 - tip} ${y2 + tip * 0.8}`} color={lighter(color, 0.3)} />
      {Array.from({ length: leaves }, (_, i) => {
        const t = 0.35 + (i / Math.max(1, leaves - 1)) * 0.6;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + sag * 4 * t * (1 - t) - 6;
        const a = -40 + r() * 80;
        return (
          <g key={i} transform={`rotate(${a} ${x} ${y})`}>
            <path d={`M ${x} ${y} Q ${x + 26} ${y - 40} ${x} ${y - 78} Q ${x - 26} ${y - 40} ${x} ${y} Z`} fill={i % 2 ? leaf : lighter(leaf, 0.12)} />
            <Stitch d={`M ${x} ${y - 8} L ${x} ${y - 66}`} color={lighter(leaf, 0.45)} width={2} />
          </g>
        );
      })}
    </Felt>
  );
};

/** Top-edge y of a Branch at a given x (for placing a character's feet). */
export function branchTopY(from: [number, number], to: [number, number], x: number, sag = 18) {
  const t = Math.min(1, Math.max(0, (x - from[0]) / (to[0] - from[0])));
  const my = (from[1] + to[1]) / 2 + sag;
  return (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * my + t * t * to[1];
}

/** Smiling sun with slowly turning felt rays. */
export const Sun: React.FC<{ x: number; y: number; r?: number; face?: boolean }> = ({ x, y, r = 90, face = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const turn = (frame / fps) * 6;
  const id = useId("sun");
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0.3" stopColor="#fff2b0" stopOpacity={0.7} />
          <stop offset="1" stopColor="#fff2b0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 3} fill={`url(#${id})`} />
      <Felt>
        <g transform={`rotate(${turn} ${x} ${y})`}>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r1 = r * 1.15;
            const r2 = r * (i % 2 ? 1.5 : 1.7);
            const w = 0.13;
            return (
              <path
                key={i}
                d={`M ${x + Math.cos(a - w) * r1} ${y + Math.sin(a - w) * r1} L ${x + Math.cos(a) * r2} ${y + Math.sin(a) * r2} L ${x + Math.cos(a + w) * r1} ${y + Math.sin(a + w) * r1} Z`}
                fill="#ffb84d"
              />
            );
          })}
        </g>
        <FeltEllipse cx={x} cy={y} rx={r} fill="#ffd34d" inset={12} />
        {face ? (
          <g>
            <circle cx={x - r * 0.3} cy={y - r * 0.08} r={r * 0.08} fill="#5a3a1a" />
            <circle cx={x + r * 0.3} cy={y - r * 0.08} r={r * 0.08} fill="#5a3a1a" />
            <path d={`M ${x - r * 0.28} ${y + r * 0.2} Q ${x} ${y + r * 0.45} ${x + r * 0.28} ${y + r * 0.2}`} stroke="#5a3a1a" strokeWidth={r * 0.07} fill="none" strokeLinecap="round" />
            <ellipse cx={x - r * 0.52} cy={y + r * 0.15} rx={r * 0.12} ry={r * 0.07} fill="#f58f6b" opacity={0.6} />
            <ellipse cx={x + r * 0.52} cy={y + r * 0.15} rx={r * 0.12} ry={r * 0.07} fill="#f58f6b" opacity={0.6} />
          </g>
        ) : null}
      </Felt>
    </g>
  );
};

const PETALS = ["#f6a6b2", "#ffd65c", "#b7c4ff", "#ffffff", "#ffb979", "#d7a6f2"];

/** One felt flower. (x, y) is where the stem meets the ground. `grow` 0→1 pops it up. */
export const Flower: React.FC<{ x: number; y: number; size?: number; color?: string; grow?: number; seed?: number }> = ({
  x,
  y,
  size = 30,
  color = PETALS[0],
  grow = 1,
  seed = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (grow <= 0) return null;
  const sway = 4 * wobble(frame, fps, 2.8 + (seed % 4) * 0.3, seed);
  const stem = size * 2.6 * grow;
  const hx = x;
  const hy = y - stem;
  return (
    <g transform={`rotate(${sway} ${x} ${y})`}>
      <path d={`M ${x} ${y} Q ${x - 6} ${y - stem / 2} ${hx} ${hy}`} stroke="#3f8a4f" strokeWidth={size * 0.18} fill="none" strokeLinecap="round" />
      <g transform={`translate(${hx} ${hy}) scale(${grow}) translate(${-hx} ${-hy})`}>
        <Felt>
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
            return <circle key={i} cx={hx + Math.cos(a) * size * 0.62} cy={hy + Math.sin(a) * size * 0.62} r={size * 0.5} fill={color} />;
          })}
          <circle cx={hx} cy={hy} r={size * 0.38} fill="#ffcf3d" />
          <Stitch d={ellipsePath(hx, hy, size * 0.25, size * 0.25)} color="#fff3b0" width={1.6} />
        </Felt>
      </g>
    </g>
  );
};

/** A scattered row of flowers along the ground line `groundAt`. */
export const FlowerPatch: React.FC<{ groundAt: (x: number) => number; count?: number; seed?: number; from?: number; to?: number; size?: number }> = ({
  groundAt,
  count = 14,
  seed = 3,
  from = 0,
  to = W,
  size = 24,
}) => {
  const r = rng(seed);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x = from + ((i + r() * 0.8) / count) * (to - from);
        return <Flower key={i} x={x} y={groundAt(x) + 10 + r() * 30} size={size * (0.75 + r() * 0.5)} color={PETALS[Math.floor(r() * PETALS.length)]} seed={i + seed} />;
      })}
    </g>
  );
};

/** Gently falling snow that loops forever. */
export const Snowfall: React.FC<{ count?: number; seed?: number; speed?: number }> = ({ count = 70, seed = 5, speed = 60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rng(seed);
  const t = frame / fps;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const x0 = r() * W;
        const y0 = r() * (H + 60);
        const size = 3 + r() * 7;
        const v = speed * (0.6 + size / 10);
        const y = ((y0 + v * t) % (H + 60)) - 30;
        const x = x0 + 30 * Math.sin(t * (0.6 + r() * 0.6) + i);
        return <circle key={i} cx={x} cy={y} r={size} fill="#ffffff" opacity={0.55 + size / 25} />;
      })}
    </g>
  );
};

/** Butterflies fluttering in loops over an area. */
export const Butterflies: React.FC<{ count?: number; seed?: number; area?: [number, number, number, number] }> = ({
  count = 4,
  seed = 2,
  area = [200, 300, W - 400, 400],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const r = rng(seed);
  const t = frame / fps;
  const [x0, y0, w, h] = area;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const cx = x0 + r() * w;
        const cy = y0 + r() * h;
        const p = r() * 6;
        const x = cx + 120 * Math.sin(t * 0.5 + p);
        const y = cy + 50 * Math.sin(t * 0.9 + p * 2);
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * 9 + p));
        const color = PETALS[(i + 1) % PETALS.length];
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${10 * Math.sin(t + p)})`}>
            <g transform={`scale(${flap} 1)`}>
              <ellipse cx={-14} cy={-6} rx={14} ry={11} fill={color} />
              <ellipse cx={14} cy={-6} rx={14} ry={11} fill={color} />
              <ellipse cx={-10} cy={9} rx={9} ry={8} fill={darker(color, 0.1)} />
              <ellipse cx={10} cy={9} rx={9} ry={8} fill={darker(color, 0.1)} />
            </g>
            <rect x={-2.5} y={-14} width={5} height={28} rx={2.5} fill="#4a3a4a" />
          </g>
        );
      })}
    </g>
  );
};

export type ThingKind = "star" | "flower" | "snowflake" | "apple" | "shell";

/** A countable felt object for counting stories and treasures. `pop` 0→1 springs it in. */
export const Thing: React.FC<{ kind: ThingKind; x: number; y: number; size?: number; pop?: number; glow?: boolean }> = ({
  kind,
  x,
  y,
  size = 60,
  pop = 1,
  glow = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (pop <= 0) return null;
  const bob = 6 * wobble(frame, fps, 2.4, x / 100);
  const s = size;
  let body: React.ReactNode = null;
  if (kind === "star") {
    body = (
      <>
        <path d={starPath(x, y, s)} fill="#ffd65c" stroke="#ffd65c" strokeWidth={8} strokeLinejoin="round" />
        <Stitch d={starPath(x, y, s * 0.68)} color="#fff1b0" width={2} />
      </>
    );
  } else if (kind === "flower") {
    body = (
      <>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <circle key={i} cx={x + Math.cos(a) * s * 0.55} cy={y + Math.sin(a) * s * 0.55} r={s * 0.42} fill="#f6a6b2" />;
        })}
        <FeltEllipse cx={x} cy={y} rx={s * 0.38} fill="#ffcf3d" inset={6} />
      </>
    );
  } else if (kind === "snowflake") {
    body = (
      <g stroke="#ffffff" strokeWidth={s * 0.14} strokeLinecap="round" fill="none">
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const ex = x + Math.cos(a) * s;
          const ey = y + Math.sin(a) * s;
          const mx = x + Math.cos(a) * s * 0.55;
          const my = y + Math.sin(a) * s * 0.55;
          const b = 0.6;
          return (
            <g key={i}>
              <path d={`M ${x} ${y} L ${ex} ${ey}`} />
              <path d={`M ${mx} ${my} L ${mx + Math.cos(a + b) * s * 0.3} ${my + Math.sin(a + b) * s * 0.3} M ${mx} ${my} L ${mx + Math.cos(a - b) * s * 0.3} ${my + Math.sin(a - b) * s * 0.3}`} />
            </g>
          );
        })}
      </g>
    );
  } else if (kind === "apple") {
    body = (
      <>
        <path d={`M ${x} ${y - s * 0.7} q ${s * 0.05} ${-s * 0.3} ${s * 0.18} ${-s * 0.42}`} stroke="#5a3d26" strokeWidth={s * 0.1} strokeLinecap="round" fill="none" />
        <path d={`M ${x + s * 0.08} ${y - s * 0.8} q ${s * 0.4} ${-s * 0.25} ${s * 0.55} ${s * 0.02} q ${-s * 0.35} ${s * 0.18} ${-s * 0.55} ${-s * 0.02} Z`} fill="#4f9a55" />
        <path d={`M ${x} ${y - s * 0.62} C ${x - s * 0.5} ${y - s * 0.95} ${x - s * 1.05} ${y - s * 0.2} ${x - s * 0.55} ${y + s * 0.55} C ${x - s * 0.3} ${y + s * 0.9} ${x} ${y + s * 0.75} ${x} ${y + s * 0.75} C ${x} ${y + s * 0.75} ${x + s * 0.3} ${y + s * 0.9} ${x + s * 0.55} ${y + s * 0.55} C ${x + s * 1.05} ${y - s * 0.2} ${x + s * 0.5} ${y - s * 0.95} ${x} ${y - s * 0.62} Z`} fill="#e0503f" />
        <Stitch d={`M ${x - s * 0.5} ${y - s * 0.1} Q ${x - s * 0.45} ${y + s * 0.5} ${x - s * 0.1} ${y + s * 0.6}`} color="#f39a8c" width={2.2} />
      </>
    );
  } else if (kind === "shell") {
    body = (
      <>
        <path d={`M ${x - s * 0.9} ${y + s * 0.5} Q ${x - s} ${y - s * 0.6} ${x} ${y - s * 0.75} Q ${x + s} ${y - s * 0.6} ${x + s * 0.9} ${y + s * 0.5} Q ${x} ${y + s * 0.8} ${x - s * 0.9} ${y + s * 0.5} Z`} fill="#f7c6b5" />
        {[-0.5, -0.17, 0.17, 0.5].map((k, i) => (
          <Stitch key={i} d={`M ${x + k * s * 0.4} ${y + s * 0.6} Q ${x + k * s * 1.2} ${y - s * 0.1} ${x + k * s * 0.3} ${y - s * 0.7}`} color="#fff1ea" width={2.2} />
        ))}
      </>
    );
  }
  return (
    <g transform={`translate(0 ${bob}) translate(${x} ${y}) scale(${pop}) translate(${-x} ${-y})`}>
      {glow ? <circle cx={x} cy={y} r={s * 1.3} fill="#fff3b0" opacity={0.6} filter="url(#glow)" /> : null}
      <Felt>{body}</Felt>
    </g>
  );
};
