import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { H, W, darker, rng } from "./felt.tsx";
import { monsteraShape } from "./plant.tsx";

// Sketchbook kit: crayon and pencil on paper. Lines "boil" (re-drawn a little
// differently every frame, like hand-drawn animation), strokes draw themselves on,
// colour is scribbled in, and words are handwritten.

export const HAND = "Caveat, 'Gochi Hand', cursive";
export const CRAYON_TYPE = "'Gochi Hand', Caveat, cursive";
export const GRAPHITE = "#55565b";
export const PAPER = "#f7f2e6";

const BOILS = [0, 1, 2];

/** Crayon (waxy, broken by the paper's tooth) and pencil filters, three boil variants each. */
export const SketchDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter id="paper-tooth" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={3} seed={4} result="n" />
        <feColorMatrix in="n" type="saturate" values="0" result="g" />
        <feComponentTransfer in="g" result="t">
          <feFuncR type="linear" slope={0.22} intercept={0.86} />
          <feFuncG type="linear" slope={0.22} intercept={0.86} />
          <feFuncB type="linear" slope={0.22} intercept={0.86} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="t" mode="multiply" result="b" />
        <feComposite in="b" in2="SourceGraphic" operator="in" />
      </filter>
      {BOILS.map((i) => (
        <React.Fragment key={i}>
          <filter id={`crayon-${i}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={20 + i * 7} result="wob" />
            <feDisplacementMap in="SourceGraphic" in2="wob" scale={6} xChannelSelector="R" yChannelSelector="G" result="wobbly" />
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={2} seed={3} result="tooth" />
            <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.2 0 0 0 -1.15" result="mask" />
            <feComposite in="wobbly" in2="mask" operator="in" />
          </filter>
          <filter id={`pencil-${i}`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={40 + i * 5} result="wob" />
            <feDisplacementMap in="SourceGraphic" in2="wob" scale={3.5} xChannelSelector="R" yChannelSelector="G" result="wobbly" />
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={2} seed={8} result="tooth" />
            <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.55" result="mask" />
            <feComposite in="wobbly" in2="mask" operator="in" />
          </filter>
        </React.Fragment>
      ))}
    </defs>
  </svg>
);

/** Which boil variant this frame uses: it changes every frame (12 fps = drawings on twos). */
export function useBoil() {
  return useCurrentFrame() % 3;
}

export type Medium = "crayon" | "pencil";

/** A group drawn in crayon or pencil, boiling. */
export const Drawn: React.FC<{ medium?: Medium; children: React.ReactNode; opacity?: number }> = ({ medium = "crayon", children, opacity }) => {
  const b = useBoil();
  return (
    <g filter={`url(#${medium}-${b})`} opacity={opacity}>
      {children}
    </g>
  );
};

/** A line that draws itself on (progress 0 → 1). Crayon gets a second, offset pass for waxy density. */
export const Line: React.FC<{ d: string; color?: string; width?: number; progress?: number; medium?: Medium; opacity?: number }> = ({
  d,
  color = GRAPHITE,
  width = 5,
  progress = 1,
  medium = "pencil",
  opacity = 1,
}) => {
  if (progress <= 0) return null;
  const dash = { pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - Math.min(1, progress) };
  return (
    <Drawn medium={medium} opacity={opacity}>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" {...dash} />
      {medium === "crayon" ? (
        <path d={d} stroke={color} strokeWidth={width * 0.7} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5 1)" opacity={0.8} {...dash} />
      ) : null}
    </Drawn>
  );
};

let clipCount = 0;
const useClipId = (p: string) => React.useMemo(() => `${p}-${clipCount++}`, [p]);

/**
 * Crayon colouring: back-and-forth strokes inside a shape, appearing as `progress`
 * goes 0 → 1, like someone colouring it in. `box` is [x, y, w, h] around the shape.
 */
export const Scribble: React.FC<{
  shape: string;
  box: [number, number, number, number];
  color: string;
  progress?: number;
  spacing?: number;
  angle?: number;
  mask?: string;
  opacity?: number;
}> = ({ shape, box, color, progress = 1, spacing = 14, angle = -30, mask, opacity = 0.9 }) => {
  const id = useClipId("scr");
  if (progress <= 0) return null;
  const [x, y, w, h] = box;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const span = Math.hypot(w, h);
  const r = rng(Math.round(x * 3 + y));
  let d = `M ${cx - span / 2} ${cy - span / 2}`;
  let dir = 1;
  for (let yy = -span / 2; yy <= span / 2; yy += spacing) {
    const j = (r() - 0.5) * spacing * 0.6;
    d += ` L ${cx + (dir * span) / 2} ${cy + yy + j}`;
    dir *= -1;
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={shape} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} mask={mask}>
        <Drawn medium="crayon" opacity={opacity}>
          <path
            d={d}
            transform={`rotate(${angle} ${cx} ${cy})`}
            stroke={color}
            strokeWidth={spacing * 0.95}
            fill="none"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - Math.min(1, progress)}
          />
        </Drawn>
      </g>
    </g>
  );
};

/** The sketchbook: one page, or an open spread with a spine and spiral. `merge` 0 → 1 fades the spine away. */
export const Sketchbook: React.FC<{ spread?: boolean; merge?: number; tint?: string; tintAt?: number }> = ({ spread = true, merge = 0, tint, tintAt = 0 }) => {
  const lines = Array.from({ length: 17 }, (_, i) => 120 + i * 56);
  const spine = spread ? 1 - merge : 0;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="#3b3430" />
      <rect x={24} y={20} width={W - 48} height={H - 36} rx={10} fill="#2a2522" opacity={0.6} />
      <rect x={30} y={16} width={W - 60} height={H - 40} rx={8} fill={PAPER} filter="url(#paper-tooth)" />
      {tint ? <rect x={W / 2} y={16} width={(W / 2 - 30) * tintAt} height={H - 40} fill={tint} opacity={0.18} /> : null}
      {lines.map((y) => (
        <line key={y} x1={60} x2={W - 60} y1={y} y2={y} stroke="#a9c4e0" strokeWidth={1.5} opacity={0.45} />
      ))}
      {spine > 0 ? (
        <g opacity={spine}>
          <defs>
            <linearGradient id="spine-shade" x1="0" x2="1">
              <stop offset="0" stopColor="#000" stopOpacity={0} />
              <stop offset="0.5" stopColor="#000" stopOpacity={0.18} />
              <stop offset="1" stopColor="#000" stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect x={W / 2 - 60} y={16} width={120} height={H - 40} fill="url(#spine-shade)" />
          {Array.from({ length: 16 }, (_, i) => (
            <g key={i}>
              <ellipse cx={W / 2} cy={60 + i * 62} rx={22} ry={9} fill="none" stroke="#8b8b90" strokeWidth={5} />
              <circle cx={W / 2 - 18} cy={60 + i * 62} r={5} fill="#3b3430" />
              <circle cx={W / 2 + 18} cy={60 + i * 62} r={5} fill="#3b3430" />
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};

type SketchLeafProps = {
  x: number;
  y: number;
  size: number;
  angle?: number;
  /** Outline drawn 0 → 1. */
  draw?: number;
  /** Colour scribbled in 0 → 1 (needs `color`). */
  fill?: number;
  color?: string | null;
  split?: number;
  holes?: number;
  wilt?: number;
  seed?: number;
  medium?: Medium;
};

/** A monstera leaf in pencil or crayon: outline, slits, holes, scribbled colour. */
export const SketchLeaf: React.FC<SketchLeafProps> = ({
  x,
  y,
  size: L,
  angle = 0,
  draw = 1,
  fill = 0,
  color = null,
  split = 1,
  holes = 1,
  wilt = 0,
  seed = 1,
  medium,
}) => {
  const maskId = useClipId("lfm");
  if (draw <= 0) return null;
  const { outline, slits, holes: hl } = monsteraShape(L, split, holes, seed);
  const ink = color ? darker(color, 0.35) : GRAPHITE;
  const m: Medium = medium ?? (color ? "crayon" : "pencil");
  const droop = wilt * 60 * Math.sign(angle || 1);
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle + droop}) scale(${1 - wilt * 0.3} ${1 - wilt * 0.1})`}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-L} y={-1.3 * L} width={2 * L} height={1.6 * L}>
          <rect x={-L} y={-1.3 * L} width={2 * L} height={1.6 * L} fill="#fff" />
          {slits.map((d, i) => (
            <path key={i} d={d} fill="#000" />
          ))}
          {hl.map((h, i) => (
            <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="#000" />
          ))}
        </mask>
      </defs>
      {color && fill > 0 ? (
        <Scribble shape={outline} box={[-0.6 * L, -1.1 * L, 1.2 * L, 1.3 * L]} color={color} progress={fill} spacing={Math.max(9, L * 0.05)} angle={-35} mask={`url(#${maskId})`} />
      ) : null}
      <g mask={`url(#${maskId})`}>
        <Line d={outline} color={ink} width={Math.max(3, L * 0.018)} progress={draw} medium={m} />
      </g>
      <defs>
        <clipPath id={`${maskId}-in`}>
          <path d={outline} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${maskId}-in)`}>
        {split > 0.05
          ? slits.map((d, i) => <Line key={i} d={d} color={ink} width={Math.max(2.5, L * 0.012)} progress={Math.max(0, draw * 1.4 - 0.4)} medium={m} />)
          : null}
      </g>
      {hl.map((h, i) => (
        <Line
          key={`h${i}`}
          d={`M ${h.cx - h.rx} ${h.cy} a ${h.rx} ${h.ry} 0 1 0 ${2 * h.rx} 0 a ${h.rx} ${h.ry} 0 1 0 ${-2 * h.rx} 0`}
          color={ink}
          width={2.5}
          progress={Math.max(0, draw * 1.4 - 0.4)}
          medium={m}
        />
      ))}
      <Line d={`M 0 ${-0.03 * L} Q ${0.03 * L} ${-0.5 * L} 0 ${-0.98 * L}`} color={ink} width={Math.max(2.5, L * 0.012)} progress={draw} medium={m} />
    </g>
  );
};

/** A pot: outline + rim, optional scribbled colour, crack, and gold mend (kintsugi). */
export const SketchPot: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  draw?: number;
  fill?: number;
  color?: string | null;
  crack?: number;
  gold?: number;
  apart?: number;
  squeeze?: number;
}> = ({ x, y, w = 240, h = 210, draw = 1, fill = 0, color = null, crack = 0, gold = 0, apart = 0, squeeze = 0 }) => {
  if (draw <= 0) return null;
  const sw = w * (1 - 0.07 * squeeze);
  const body = `M ${x - sw / 2} ${y + 34} L ${x - sw * 0.38} ${y + h} L ${x + sw * 0.38} ${y + h} L ${x + sw / 2} ${y + 34} Z`;
  const rim = `M ${x - sw / 2 - 14} ${y} H ${x + sw / 2 + 14} V ${y + 36} H ${x - sw / 2 - 14} Z`;
  const ink = color ? darker(color, 0.35) : GRAPHITE;
  const crackPath = `M ${x - 10} ${y + 36} L ${x + 16} ${y + 80} L ${x - 14} ${y + 120} L ${x + 18} ${y + 165} L ${x} ${y + h}`;
  return (
    <g>
      <g transform={`translate(${-apart} 0)`}>
        {color && fill > 0 ? <Scribble shape={body + rim} box={[x - sw / 2 - 20, y - 4, sw + 40, h + 8]} color={color} progress={fill} spacing={12} angle={-25} /> : null}
        <Line d={rim} color={ink} width={5} progress={draw} medium={color ? "crayon" : "pencil"} />
        <Line d={body} color={ink} width={5} progress={draw} medium={color ? "crayon" : "pencil"} />
      </g>
      {crack > 0 ? <Line d={crackPath} color={GRAPHITE} width={5} progress={crack} /> : null}
      {gold > 0 ? <Line d={crackPath} color="#d9a520" width={11} progress={gold} medium="crayon" /> : null}
    </g>
  );
};

export type SketchLeafSpec = { angle: number; reach: number; size: number; seed: number };

/** A whole plant: stems and leaves from a base point. `grow[i]` drives leaf i (draw then colour). */
export const SketchPlant: React.FC<{
  x: number;
  y: number;
  leaves: SketchLeafSpec[];
  grow?: number[];
  color?: string | null;
  fill?: number;
  split?: number;
  holes?: number;
  wilt?: number;
  scale?: number;
  sway?: number;
}> = ({ x, y, leaves, grow, color = null, fill = 1, split = 1, holes = 1, wilt = 0, scale = 1, sway = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {leaves.map((lf, i) => {
      const g = Math.max(0, Math.min(1, grow ? grow[i] ?? 0 : 1));
      if (g <= 0) return null;
      const a = ((lf.angle + sway * (i % 2 ? 1 : -1) + wilt * 35 * Math.sign(lf.angle || 1)) * Math.PI) / 180;
      const reach = lf.reach * (1 - wilt * 0.3);
      const tx = Math.sin(a) * reach;
      const ty = -Math.cos(a) * reach;
      const stem = `M 0 0 Q ${tx * 0.25 + lf.angle * 0.8} ${ty * 0.55} ${tx} ${ty}`;
      const ink = color ? darker(color, 0.4) : GRAPHITE;
      return (
        <g key={i}>
          <Line d={stem} color={ink} width={7} progress={Math.min(1, g * 2)} medium={color ? "crayon" : "pencil"} />
          <SketchLeaf
            x={tx}
            y={ty}
            size={lf.size}
            angle={lf.angle * 1.1 + sway * (i % 2 ? 1 : -1)}
            draw={Math.max(0, g * 2 - 1)}
            fill={fill}
            color={color}
            split={split}
            holes={holes}
            wilt={wilt}
            seed={lf.seed}
          />
        </g>
      );
    })}
  </g>
);

export type Pose = {
  /** 0 standing → 1 sitting curled up, hugging knees. */
  curl?: number;
  /** 0 → 1 arms up, chin up. */
  stretch?: number;
  /** 0 → 1 right arm reaching up and out (taking a hand). */
  reach?: number;
  /** Dance swing −1 … 1 (arms and hips). */
  swing?: number;
  /** −1 sad … 1 happy. */
  mood?: number;
  /** Head turned away (hiding): 0 → 1. */
  away?: number;
};

type Pt = [number, number];
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/**
 * A simple sketched person (feet at x, y; ~330 px tall standing). Poses blend:
 * standing, curled up, stretching, reaching. `shirt` colours the top when given.
 */
export const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  pose?: Pose;
  draw?: number;
  shirt?: string | null;
  fill?: number;
  crown?: number;
  flip?: boolean;
  opacity?: number;
}> = ({ x, y, scale = 1, pose = {}, draw = 1, shirt = null, fill = 1, crown = 0, flip = false, opacity = 1 }) => {
  if (draw <= 0) return null;
  const { curl = 0, stretch = 0, reach = 0, swing = 0, mood = 0, away = 0 } = pose;
  const stand = { head: [0, -295] as Pt, neck: [0, -250] as Pt, hip: [0, -130] as Pt, handL: [-62, -125] as Pt, handR: [62, -125] as Pt, kneeL: [-24, -66] as Pt, kneeR: [24, -66] as Pt, footL: [-34, 0] as Pt, footR: [34, 0] as Pt };
  // Sitting on the floor hugging the knees, head down on them (side view, facing right).
  const sit = { head: [8, -196] as Pt, neck: [-36, -168] as Pt, hip: [-40, -34] as Pt, handL: [44, -84] as Pt, handR: [52, -90] as Pt, kneeL: [34, -142] as Pt, kneeR: [46, -136] as Pt, footL: [52, 0] as Pt, footR: [66, 0] as Pt };
  const k = Math.min(1, curl);
  const P = Object.fromEntries(Object.keys(stand).map((key) => [key, lerpPt(stand[key as keyof typeof stand], sit[key as keyof typeof sit], k)])) as typeof stand;
  if (stretch > 0) {
    P.handL = lerpPt(P.handL, [-95, -445], stretch);
    P.handR = lerpPt(P.handR, [95, -445], stretch);
    P.head = lerpPt(P.head, [0, -305], stretch);
  }
  if (reach > 0) P.handR = lerpPt(P.handR, [120, -420], reach);
  if (swing !== 0) {
    P.handL = [P.handL[0] - 30 * swing, P.handL[1] - 60 * Math.abs(swing)];
    P.handR = [P.handR[0] - 30 * swing, P.handR[1] - 60 * Math.abs(swing)];
    P.hip = [P.hip[0] + 10 * swing, P.hip[1]];
  }
  // Side-on when curled: shoulders and hips narrow to a profile.
  const sw = 34 * (1 - 0.85 * k);
  const hw = 30 * (1 - 0.7 * k);
  const shoulderL: Pt = [P.neck[0] - sw, P.neck[1] + 14];
  const shoulderR: Pt = [P.neck[0] + sw, P.neck[1] + 14];
  const elbow = (s: Pt, h: Pt, side: number): Pt => [(s[0] + h[0]) / 2 + side * 14, (s[1] + h[1]) / 2 + 6];
  const seg = (...pts: Pt[]) => "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const torso = `M ${shoulderL[0]} ${shoulderL[1]} Q ${P.neck[0] - 30 * k} ${P.neck[1] - 6} ${shoulderR[0]} ${shoulderR[1]} Q ${P.hip[0] + hw + 40 * k} ${(P.neck[1] + P.hip[1]) / 2} ${P.hip[0] + hw} ${P.hip[1]} L ${P.hip[0] - hw} ${P.hip[1]} Q ${P.hip[0] - hw - 30 * k} ${(P.neck[1] + P.hip[1]) / 2} ${shoulderL[0]} ${shoulderL[1]} Z`;
  const hr = 44;
  const [hx, hy] = P.head;
  const ink = GRAPHITE;
  const sm = mood * 10;
  const face = away > 0.5 ? null : (
    <g>
      <Line d={`M ${hx - 15} ${hy - 6} l 0.5 0.5`} color={ink} width={7} progress={draw} />
      <Line d={`M ${hx + 15} ${hy - 6} l 0.5 0.5`} color={ink} width={7} progress={draw} />
      <Line d={`M ${hx - 14} ${hy + 16} Q ${hx} ${hy + 16 + sm} ${hx + 14} ${hy + 16}`} color={ink} width={4} progress={draw} />
    </g>
  );
  const headShape = `M ${hx - hr} ${hy} a ${hr} ${hr * 1.05} 0 1 0 ${2 * hr} 0 a ${hr} ${hr * 1.05} 0 1 0 ${-2 * hr} 0`;
  const hair = `M ${hx - hr + 4} ${hy - 10} Q ${hx} ${hy - hr * 1.5} ${hx + hr - 4} ${hy - 10}`;
  const crownLeaves = crown > 0
    ? [-1, 0, 1].map((s) => <SketchLeaf key={s} x={hx + s * 34} y={hy - hr + 8} size={58 * crown} angle={s * 35} color="#3f9a55" fill={1} draw={crown} split={0.6} holes={0.5} seed={300 + s} />)
    : null;
  if (curl >= 0.5) return <CurledUp x={x} y={y} scale={scale} flip={flip} draw={draw} opacity={opacity} shirt={shirt} fill={fill} />;
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * scale} ${scale})`} opacity={opacity}>
      {shirt && fill > 0 ? <Scribble shape={torso} box={[-90, -300, 180, 260]} color={shirt} progress={fill} spacing={11} angle={-20} /> : null}
      <Line d={torso} color={ink} width={5} progress={draw} />
      <Line d={seg([P.hip[0] - 18 * (1 - k), P.hip[1]], P.kneeL, P.footL)} color={ink} width={5} progress={draw} />
      <Line d={seg([P.hip[0] + 18 * (1 - k), P.hip[1]], P.kneeR, P.footR)} color={ink} width={5} progress={draw} />
      <Line d={seg(shoulderL, elbow(shoulderL, P.handL, -1), P.handL)} color={ink} width={5} progress={draw} />
      <Line d={seg(shoulderR, elbow(shoulderR, P.handR, 1), P.handR)} color={ink} width={5} progress={draw} />
      {away > 0.5 ? <Scribble shape={headShape} box={[hx - hr, hy - hr * 1.1, 2 * hr, 2.2 * hr]} color="#5a5048" progress={draw} spacing={9} angle={-60} /> : null}
      <Line d={headShape} color={ink} width={5} progress={draw} />
      {away > 0.5 ? null : <Line d={hair} color={ink} width={9} progress={draw} />}
      {face}
      {crownLeaves}
    </g>
  );
};

/**
 * Key drawing: sitting on the floor, arms around the knees, head down on them
 * (side view, facing right; feet at x, y).
 */
const CurledUp: React.FC<{ x: number; y: number; scale: number; flip: boolean; draw: number; opacity: number; shirt: string | null; fill: number }> = ({
  x,
  y,
  scale,
  flip,
  draw,
  opacity,
  shirt,
  fill,
}) => {
  const body = "M -64 -6 Q -104 -92 -44 -156 Q 6 -150 40 -120 Q 2 -64 -64 -6 Z";
  const head = "M -33 -178 a 42 44 0 1 0 84 0 a 42 44 0 1 0 -84 0";
  return (
    <g transform={`translate(${x} ${y}) scale(${(flip ? -1 : 1) * scale} ${scale})`} opacity={opacity}>
      {shirt && fill > 0 ? <Scribble shape={body} box={[-110, -170, 160, 170]} color={shirt} progress={fill} spacing={11} angle={-20} /> : null}
      <Line d="M -64 -6 Q -104 -92 -44 -156" width={5} progress={draw} />
      <Line d="M 62 0 L 44 -120 Q 2 -64 -64 -8" width={5} progress={draw} />
      <Line d="M 78 0 L 60 -114" width={5} progress={draw} />
      <Line d="M -34 -146 Q 30 -158 64 -116 Q 74 -92 54 -78" width={5} progress={draw} />
      <Line d="M -22 -132 Q 36 -136 60 -102" width={4} progress={draw} />
      <Scribble shape={head} box={[-35, -224, 88, 92]} color="#5a5048" progress={draw} spacing={9} angle={-60} />
      <Line d={head} width={5} progress={draw} />
    </g>
  );
};

/** A helping hand reaching from (x, y) towards (tx, ty), in crayon: forearm, open palm, fingers. */
export const ReachingHand: React.FC<{ x: number; y: number; tx: number; ty: number; color?: string; draw?: number }> = ({ x, y, tx, ty, color = "#e0874a", draw = 1 }) => {
  if (draw <= 0) return null;
  const ang = (Math.atan2(ty - y, tx - x) * 180) / Math.PI;
  const len = Math.hypot(tx - x, ty - y);
  const ink = darker(color, 0.3);
  const px = len - 10;
  const arm = `M 0 -24 L ${px - 40} -28 L ${px - 40} 28 L 0 24 Z`;
  const palm = `M ${px - 44} -34 Q ${px + 10} -44 ${px + 34} -20 Q ${px + 44} 0 ${px + 34} 22 Q ${px + 10} 42 ${px - 44} 32 Z`;
  const fingers = [-24, -8, 8, 22]
    .map((o, i) => `M ${px + 30} ${o} q 30 ${o * 0.15} ${48 - Math.abs(i - 1.5) * 8} ${o * 0.25}`)
    .join(" ");
  const thumb = `M ${px - 4} -38 q 22 -30 46 -40`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <Scribble shape={arm + palm} box={[0, -50, len + 50, 100]} color={color} progress={draw} spacing={10} angle={70} />
      <Line d={arm} color={ink} width={5} progress={draw} medium="crayon" />
      <Line d={palm} color={ink} width={5} progress={draw} medium="crayon" />
      <Line d={fingers + " " + thumb} color={ink} width={13} progress={Math.max(0, draw * 2 - 1)} medium="crayon" />
      <Line d={fingers + " " + thumb} color={color} width={8} progress={Math.max(0, draw * 2 - 1)} medium="crayon" />
    </g>
  );
};

/** Handwriting that writes itself left to right (progress 0 → 1). */
export const Handwriting: React.FC<{
  text: string;
  x: number;
  y: number;
  size?: number;
  color?: string;
  progress?: number;
  font?: string;
  anchor?: "start" | "middle";
  rotate?: number;
  weight?: number;
}> = ({ text, x, y, size = 80, color = GRAPHITE, progress = 1, font = HAND, anchor = "start", rotate = -2, weight = 700 }) => {
  const id = useClipId("hw");
  if (progress <= 0) return null;
  const width = text.length * size * 0.48;
  const left = anchor === "middle" ? x - width / 2 : x;
  return (
    <g transform={`rotate(${rotate} ${x} ${y})`}>
      <defs>
        <clipPath id={id}>
          <rect x={left - 20} y={y - size * 1.1} width={(width + 40) * Math.min(1, progress)} height={size * 1.6} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <Drawn medium="crayon">
          <text x={x} y={y} textAnchor={anchor} fontFamily={font} fontWeight={weight} fontSize={size} fill={color}>
            {text}
          </text>
        </Drawn>
      </g>
    </g>
  );
};

/** A tangled scribble cloud (knotted thoughts, tangled roots). `draw` 0 → 1. */
export const Tangle: React.FC<{ x: number; y: number; r?: number; draw?: number; color?: string; seed?: number; loops?: number }> = ({
  x,
  y,
  r = 80,
  draw = 1,
  color = GRAPHITE,
  seed = 1,
  loops = 14,
}) => {
  const g = rng(seed);
  let d = `M ${x} ${y}`;
  for (let i = 0; i < loops; i++) {
    const a = g() * Math.PI * 2;
    const rr = r * (0.3 + g() * 0.7);
    d += ` Q ${x + Math.cos(a + 1) * rr * 1.2} ${y + Math.sin(a + 1) * rr * 0.8} ${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr * 0.7}`;
  }
  return <Line d={d} color={color} width={4} progress={draw} />;
};

/** Hand-drawn sun: scribbled disc + rays. */
export const SketchSun: React.FC<{ x: number; y: number; r?: number; draw?: number }> = ({ x, y, r = 80, draw = 1 }) => {
  if (draw <= 0) return null;
  const disc = `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `M ${x + Math.cos(a) * r * 1.25} ${y + Math.sin(a) * r * 1.25} L ${x + Math.cos(a) * r * 1.7} ${y + Math.sin(a) * r * 1.7}`;
  }).join(" ");
  return (
    <g>
      <Scribble shape={disc} box={[x - r, y - r, 2 * r, 2 * r]} color="#f5c33b" progress={draw} spacing={12} />
      <Line d={disc} color="#d98c1f" width={6} progress={draw} medium="crayon" />
      <Line d={rays} color="#e9a52a" width={7} progress={draw} medium="crayon" />
    </g>
  );
};

type LyricLine = { text: string; start: number; end: number; words: { w: string; start: number; end: number }[] };

/** Lyrics handwritten at the foot of the page, each word appearing as it is sung. */
export const JournalLyrics: React.FC<{ lines: LyricLine[]; t: number }> = ({ lines, t }) => {
  const line = lines.find((l) => t >= l.start - 0.1 && t <= l.end + 0.9);
  if (!line) return null;
  const out = interpolate(t, [line.end + 0.55, line.end + 0.9], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 52, display: "flex", justifyContent: "center", opacity: out }}>
      {/* A strip of paper taped over the page, so the words stay readable over the spine. */}
      <div style={{ display: "flex", gap: "0 18px", transform: "rotate(-1deg)", background: "rgba(250, 246, 236, 0.92)", padding: "2px 30px 6px", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
        {line.words.map((w, i) =>
          t >= w.start ? (
            <span key={i} style={{ fontFamily: HAND, fontWeight: 700, fontSize: 64, color: "#3d3e44", opacity: 0.88 }}>
              {w.w}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
};
