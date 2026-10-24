import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Felt, FeltEllipse, Stitch, darker, ellipsePath, lighter } from "./felt.tsx";
import { wobble } from "./scene.tsx";

// Characters. Each is drawn around (0, 0) = the middle of the feet, about
// 200px tall at scale 1, then placed with x / y / scale. One look per
// character: pick colours once in the story and reuse them in every scene.

type Pose = {
  x: number;
  y: number;
  scale?: number;
  /** Mirror to face left. */
  flip?: boolean;
  /** -1 … 1, where the eyes look horizontally. */
  look?: number;
  /** 0 open … 1 closed (sleepy). */
  sleepy?: number;
  /** Wing / arm flapping strength 0 … 1. */
  flap?: number;
  /** Idle bounce strength 0 … 1. */
  bob?: number;
  /** Extra rotation in degrees (leaning, tumbling). */
  tilt?: number;
};

/** Blink about every 4 s, unless already sleepy. */
function useBlink(seed: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const period = Math.round(fps * (3.4 + (seed % 3) * 0.6));
  const t = (frame + seed * 17) % period;
  return t < 3 ? 1 - Math.abs(t - 1.5) / 1.5 : 0;
}

const Eye: React.FC<{ cx: number; cy: number; r: number; look: number; closed: number; lid: string; ring?: string }> = ({
  cx,
  cy,
  r,
  look,
  closed,
  lid,
  ring,
}) => {
  const pr = r * 0.55;
  const px = cx + look * r * 0.28;
  return (
    <g>
      {ring ? <circle cx={cx} cy={cy} r={r * 1.28} fill={ring} /> : null}
      <circle cx={cx} cy={cy} r={r} fill="#fffaf0" />
      <circle cx={px} cy={cy + r * 0.05} r={pr} fill="#1d1a24" />
      <circle cx={px - pr * 0.35} cy={cy - pr * 0.35} r={pr * 0.32} fill="#ffffff" />
      {closed > 0.02 ? (
        <g>
          <clipPath id={`lid-${Math.round(cx)}-${Math.round(cy)}`}>
            <circle cx={cx} cy={cy} r={r + 1} />
          </clipPath>
          <rect
            x={cx - r - 2}
            y={cy - r - 2}
            width={r * 2 + 4}
            height={(r * 2 + 4) * closed}
            fill={lid}
            clipPath={`url(#lid-${Math.round(cx)}-${Math.round(cy)})`}
          />
          {closed > 0.8 ? (
            <path d={`M ${cx - r * 0.8} ${cy + r * 0.1} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.8} ${cy + r * 0.1}`} stroke="#1d1a24" strokeWidth={r * 0.14} fill="none" strokeLinecap="round" />
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

function usePose(p: Pose, seed: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bob = (p.bob ?? 0.5) * 6 * wobble(frame, fps, 1.8, seed);
  const flapAngle = (p.flap ?? 0) * 38 * Math.sin((frame / fps) * Math.PI * 2 * 2.4);
  const blink = useBlink(seed);
  const closed = Math.max(p.sleepy ?? 0, blink);
  const transform = `translate(${p.x} ${p.y + bob}) rotate(${p.tilt ?? 0}) scale(${(p.flip ? -1 : 1) * (p.scale ?? 1)} ${p.scale ?? 1})`;
  return { transform, flapAngle, closed, look: (p.flip ? -1 : 1) * (p.look ?? 0) };
}

type OwlProps = Pose & { color?: string; belly?: string; face?: string };

export const Owl: React.FC<OwlProps> = ({ color = "#8a6a9e", belly = "#e9d9b8", face = "#f3e6cc", ...pose }) => {
  const { transform, flapAngle, closed, look } = usePose(pose, 2);
  const beak = "#f0a33a";
  return (
    <g transform={transform}>
      <Felt>
        {/* wings behind the body */}
        <g transform={`rotate(${-flapAngle - 8} -62 -110)`}>
          <ellipse cx={-80} cy={-80} rx={30} ry={62} fill={darker(color, 0.15)} />
          <Stitch d={ellipsePath(-80, -80, 20, 50)} color={lighter(color, 0.3)} width={2} />
        </g>
        <g transform={`rotate(${flapAngle + 8} 62 -110)`}>
          <ellipse cx={80} cy={-80} rx={30} ry={62} fill={darker(color, 0.15)} />
          <Stitch d={ellipsePath(80, -80, 20, 50)} color={lighter(color, 0.3)} width={2} />
        </g>
        {/* ear tufts */}
        <path d="M -70 -170 L -86 -228 L -30 -186 Z" fill={color} />
        <path d="M 70 -170 L 86 -228 L 30 -186 Z" fill={color} />
        {/* body */}
        <FeltEllipse cx={0} cy={-100} rx={86} ry={102} fill={color} inset={11} />
        <ellipse cx={0} cy={-62} rx={54} ry={56} fill={belly} />
        {[0, 1, 2].map((row) =>
          [-1, 0, 1].map((col) => (
            <path
              key={`${row}${col}`}
              d={`M ${col * 26 - 9 + (row % 2) * 13} ${-82 + row * 22} q 9 9 18 0`}
              stroke={darker(belly, 0.18)}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          )),
        )}
        {/* face disc */}
        <ellipse cx={-30} cy={-140} rx={42} ry={38} fill={face} />
        <ellipse cx={30} cy={-140} rx={42} ry={38} fill={face} />
        {/* feet */}
        <path d="M -34 -4 l -10 8 m 10 -8 l 0 10 m 0 -10 l 10 8" stroke={beak} strokeWidth={7} strokeLinecap="round" />
        <path d="M 34 -4 l -10 8 m 10 -8 l 0 10 m 0 -10 l 10 8" stroke={beak} strokeWidth={7} strokeLinecap="round" />
      </Felt>
      <Eye cx={-30} cy={-142} r={24} look={look} closed={closed} lid={face} />
      <Eye cx={30} cy={-142} r={24} look={look} closed={closed} lid={face} />
      <path d="M -11 -118 L 11 -118 L 0 -98 Z" fill={beak} stroke={darker(beak, 0.15)} strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={-56} cy={-112} rx={11} ry={7} fill="#f19a9a" opacity={0.55} />
      <ellipse cx={56} cy={-112} rx={11} ry={7} fill="#f19a9a" opacity={0.55} />
    </g>
  );
};

export type CritterKind = "mouse" | "bunny" | "bear" | "fox" | "cat" | "hedgehog";

type CritterProps = Pose & { kind: CritterKind; color?: string; belly?: string; scarf?: string };

const DEFAULT_COLORS: Record<CritterKind, [string, string]> = {
  mouse: ["#a9a3b5", "#efe3d6"],
  bunny: ["#e9dccb", "#fbf3ea"],
  bear: ["#9b6a45", "#e2c49c"],
  fox: ["#e07b39", "#fbefe0"],
  cat: ["#5f6c86", "#e9e4dc"],
  hedgehog: ["#8a6a4e", "#f0dcc0"],
};

/** Character builder: one body, kind-specific ears, nose and tail. */
export const Critter: React.FC<CritterProps> = ({ kind, color, belly, scarf, ...pose }) => {
  const [c0, b0] = DEFAULT_COLORS[kind];
  const c = color ?? c0;
  const b = belly ?? b0;
  const { transform, flapAngle, closed, look } = usePose(pose, kind.length);
  const inner = "#f2a5a8";
  const ears: Record<CritterKind, React.ReactNode> = {
    mouse: (
      <>
        <FeltEllipse cx={-56} cy={-196} rx={42} fill={c} inset={9} />
        <FeltEllipse cx={56} cy={-196} rx={42} fill={c} inset={9} />
        <circle cx={-56} cy={-196} r={24} fill={inner} />
        <circle cx={56} cy={-196} r={24} fill={inner} />
      </>
    ),
    bunny: (
      <>
        <ellipse cx={-30} cy={-250} rx={22} ry={72} fill={c} transform="rotate(-10 -30 -250)" />
        <ellipse cx={30} cy={-250} rx={22} ry={72} fill={c} transform="rotate(10 30 -250)" />
        <ellipse cx={-30} cy={-246} rx={10} ry={50} fill={inner} transform="rotate(-10 -30 -246)" />
        <ellipse cx={30} cy={-246} rx={10} ry={50} fill={inner} transform="rotate(10 30 -246)" />
      </>
    ),
    bear: (
      <>
        <FeltEllipse cx={-52} cy={-198} rx={26} fill={c} stitch={false} />
        <FeltEllipse cx={52} cy={-198} rx={26} fill={c} stitch={false} />
        <circle cx={-52} cy={-198} r={13} fill={b} />
        <circle cx={52} cy={-198} r={13} fill={b} />
      </>
    ),
    fox: (
      <>
        <path d="M -70 -170 L -62 -250 L -16 -196 Z" fill={c} />
        <path d="M 70 -170 L 62 -250 L 16 -196 Z" fill={c} />
        <path d="M -58 -182 L -56 -230 L -32 -200 Z" fill="#3a2a2a" />
        <path d="M 58 -182 L 56 -230 L 32 -200 Z" fill="#3a2a2a" />
      </>
    ),
    cat: (
      <>
        <path d="M -72 -168 L -60 -240 L -18 -198 Z" fill={c} />
        <path d="M 72 -168 L 60 -240 L 18 -198 Z" fill={c} />
        <path d="M -60 -182 L -56 -222 L -34 -200 Z" fill={inner} />
        <path d="M 60 -182 L 56 -222 L 34 -200 Z" fill={inner} />
      </>
    ),
    hedgehog: (
      <g>
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (1.05 + (i / 10) * 0.9);
          const x = Math.cos(a) * 100;
          const y = -110 + Math.sin(a) * 100;
          const x2 = Math.cos(a) * 150;
          const y2 = -110 + Math.sin(a) * 150;
          const n = Math.sin(a + 0.25);
          return <path key={i} d={`M ${x - n * 20} ${y} L ${x2} ${y2} L ${x + n * 20} ${y + 10} Z`} fill={darker(c, 0.25)} />;
        })}
      </g>
    ),
  };
  const tail: Partial<Record<CritterKind, React.ReactNode>> = {
    mouse: <path d="M 70 -30 C 140 -20 150 -90 120 -110" stroke={inner} strokeWidth={8} fill="none" strokeLinecap="round" />,
    bunny: <FeltEllipse cx={78} cy={-36} rx={24} fill="#ffffff" stitch={false} />,
    fox: (
      <g>
        <path d="M 60 -40 C 160 -40 190 -120 150 -170 C 150 -110 110 -80 60 -80 Z" fill={c} />
        <path d="M 150 -170 C 175 -140 172 -118 160 -100 C 150 -120 145 -140 150 -170 Z" fill="#fbefe0" />
      </g>
    ),
    cat: <path d="M 70 -30 C 150 -30 140 -130 110 -150" stroke={c} strokeWidth={18} fill="none" strokeLinecap="round" />,
  };
  const snout = kind === "bear" || kind === "fox" || kind === "hedgehog";
  return (
    <g transform={transform}>
      <Felt>
        {tail[kind]}
        {ears[kind]}
        {/* arms */}
        <g transform={`rotate(${-flapAngle} -64 -90)`}>
          <ellipse cx={-72} cy={-62} rx={20} ry={40} fill={darker(c, 0.08)} />
        </g>
        <g transform={`rotate(${flapAngle} 64 -90)`}>
          <ellipse cx={72} cy={-62} rx={20} ry={40} fill={darker(c, 0.08)} />
        </g>
        <FeltEllipse cx={0} cy={-80} rx={70} ry={80} fill={c} inset={10} />
        <ellipse cx={0} cy={-56} rx={44} ry={46} fill={b} />
        <FeltEllipse cx={0} cy={-160} rx={78} ry={66} fill={c} inset={10} />
        {snout ? <ellipse cx={0} cy={-134} rx={34} ry={24} fill={b} /> : null}
        {kind === "fox" ? <path d="M -78 -150 Q -40 -110 0 -112 Q 40 -110 78 -150 Q 60 -100 0 -100 Q -60 -100 -78 -150 Z" fill="#fbefe0" /> : null}
        <ellipse cx={-30} cy={-6} rx={26} ry={14} fill={darker(c, 0.12)} />
        <ellipse cx={30} cy={-6} rx={26} ry={14} fill={darker(c, 0.12)} />
        {scarf ? (
          <g>
            <path d="M -62 -112 Q 0 -86 62 -112 L 60 -94 Q 0 -66 -60 -94 Z" fill={scarf} />
            <path d="M 30 -96 L 46 -40 L 22 -44 L 16 -94 Z" fill={darker(scarf, 0.1)} />
            <Stitch d="M -54 -102 Q 0 -80 54 -102" color={lighter(scarf, 0.5)} width={2} />
          </g>
        ) : null}
      </Felt>
      <Eye cx={-28} cy={-166} r={14} look={look} closed={closed} lid={c} />
      <Eye cx={28} cy={-166} r={14} look={look} closed={closed} lid={c} />
      <ellipse cx={0} cy={snout ? -142 : -144} rx={10} ry={7} fill="#3a2830" />
      <path d={`M -10 ${snout ? -128 : -132} Q 0 ${snout ? -120 : -124} 10 ${snout ? -128 : -132}`} stroke="#3a2830" strokeWidth={3} fill="none" strokeLinecap="round" />
      <ellipse cx={-52} cy={-138} rx={12} ry={7} fill="#f19a9a" opacity={0.55} />
      <ellipse cx={52} cy={-138} rx={12} ry={7} fill="#f19a9a" opacity={0.55} />
      {kind === "cat" || kind === "mouse" ? (
        <g stroke="#3a2830" strokeWidth={2} strokeLinecap="round" opacity={0.7}>
          <path d="M -20 -140 L -62 -146 M -20 -136 L -60 -128" />
          <path d="M 20 -140 L 62 -146 M 20 -136 L 60 -128" />
        </g>
      ) : null}
    </g>
  );
};
