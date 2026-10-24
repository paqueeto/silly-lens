import React, { createContext, useContext } from "react";

// Materials. Mount <FeltDefs /> once per film; every shape references the
// filters by id. Put the filter on a group INSIDE any moving transform so the
// fibre texture travels with the object instead of swimming under it.

export const W = 1920;
export const H = 1080;

export const FeltDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {/* Felt: fuzzy edges, fine fibres, soft colour mottling, a cut-out shadow. */}
      <filter id="felt" x="-6%" y="-6%" width="112%" height="118%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="fine" />
        <feDisplacementMap in="SourceGraphic" in2="fine" scale={4} xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
        <feColorMatrix in="fine" type="saturate" values="0" result="fineGray" />
        <feComponentTransfer in="fineGray" result="fineTex">
          <feFuncR type="linear" slope={0.5} intercept={0.66} />
          <feFuncG type="linear" slope={0.5} intercept={0.66} />
          <feFuncB type="linear" slope={0.5} intercept={0.66} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={11} result="coarse" />
        <feColorMatrix in="coarse" type="saturate" values="0" result="coarseGray" />
        <feComponentTransfer in="coarseGray" result="coarseTex">
          <feFuncR type="linear" slope={0.35} intercept={0.82} />
          <feFuncG type="linear" slope={0.35} intercept={0.82} />
          <feFuncB type="linear" slope={0.35} intercept={0.82} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="fineTex" in2="coarseTex" mode="multiply" result="tex" />
        <feBlend in="fuzzy" in2="tex" mode="multiply" result="textured" />
        <feComposite in="textured" in2="fuzzy" operator="in" result="felted" />
        <feGaussianBlur in="fuzzy" stdDeviation={4} result="blur" />
        <feOffset in="blur" dx={0} dy={5} result="offset" />
        <feFlood floodColor="#0b0820" floodOpacity={0.32} />
        <feComposite in2="offset" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="felted" />
        </feMerge>
      </filter>

      {/* Soft felt: same edges and shadow, lighter grain, for snow and pale colours. */}
      <filter id="felt-soft" x="-6%" y="-6%" width="112%" height="118%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="fine" />
        <feDisplacementMap in="SourceGraphic" in2="fine" scale={4} xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
        <feColorMatrix in="fine" type="saturate" values="0" result="fineGray" />
        <feComponentTransfer in="fineGray" result="tex">
          <feFuncR type="linear" slope={0.22} intercept={0.86} />
          <feFuncG type="linear" slope={0.22} intercept={0.86} />
          <feFuncB type="linear" slope={0.22} intercept={0.86} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="fuzzy" in2="tex" mode="multiply" result="textured" />
        <feComposite in="textured" in2="fuzzy" operator="in" result="felted" />
        <feGaussianBlur in="fuzzy" stdDeviation={4} result="blur" />
        <feOffset in="blur" dx={0} dy={5} result="offset" />
        <feFlood floodColor="#2a3550" floodOpacity={0.22} />
        <feComposite in2="offset" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="felted" />
        </feMerge>
      </filter>

      {/* Same felt without the drop shadow, for flat background layers. */}
      <filter id="felt-flat" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={3} result="fine" />
        <feColorMatrix in="fine" type="saturate" values="0" result="fineGray" />
        <feComponentTransfer in="fineGray" result="tex">
          <feFuncR type="linear" slope={0.45} intercept={0.7} />
          <feFuncG type="linear" slope={0.45} intercept={0.7} />
          <feFuncB type="linear" slope={0.45} intercept={0.7} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="tex" mode="multiply" result="textured" />
        <feComposite in="textured" in2="SourceGraphic" operator="in" />
      </filter>

      {/* Paper: a light grain for skies and cards. */}
      <filter id="paper" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={3} seed={5} result="n" />
        <feColorMatrix in="n" type="saturate" values="0" result="g" />
        <feComponentTransfer in="g" result="tex">
          <feFuncR type="linear" slope={0.3} intercept={0.82} />
          <feFuncG type="linear" slope={0.3} intercept={0.82} />
          <feFuncB type="linear" slope={0.3} intercept={0.82} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="tex" mode="multiply" result="t" />
        <feComposite in="t" in2="SourceGraphic" operator="in" />
      </filter>

      {/* Heavy felt (material "felt"): coarse fibres, ragged fuzzy edges with stray
          fibres, soft relief lighting so it reads as cloth, and a deeper shadow. */}
      <filter id="felt-heavy" x="-8%" y="-8%" width="116%" height="124%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={7} result="fine" />
        <feDisplacementMap in="SourceGraphic" in2="fine" scale={7} xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={13} result="lumps" />
        <feDiffuseLighting in="lumps" surfaceScale={1.1} diffuseConstant={1.08} lightingColor="#ffffff" result="relief">
          <feDistantLight azimuth={235} elevation={58} />
        </feDiffuseLighting>
        <feColorMatrix in="fine" type="saturate" values="0" result="fineGray" />
        <feComponentTransfer in="fineGray" result="fibres">
          <feFuncR type="linear" slope={0.55} intercept={0.68} />
          <feFuncG type="linear" slope={0.55} intercept={0.68} />
          <feFuncB type="linear" slope={0.55} intercept={0.68} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="fibres" in2="relief" mode="multiply" result="tex" />
        <feBlend in="fuzzy" in2="tex" mode="multiply" result="textured" />
        <feComposite in="textured" in2="fuzzy" operator="in" result="felted" />
        <feGaussianBlur in="fuzzy" stdDeviation={1.6} result="haloBlur" />
        <feComponentTransfer in="haloBlur" result="halo">
          <feFuncA type="linear" slope={0.55} intercept={0} />
        </feComponentTransfer>
        <feGaussianBlur in="fuzzy" stdDeviation={6} result="blur" />
        <feOffset in="blur" dx={2} dy={8} result="offset" />
        <feFlood floodColor="#0b0820" floodOpacity={0.36} />
        <feComposite in2="offset" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="halo" />
          <feMergeNode in="felted" />
        </feMerge>
      </filter>

      {/* Heavy felt without the shadow, for the backdrop panels. */}
      <filter id="felt-heavy-flat" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves={2} seed={3} result="fine" />
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={17} result="lumps" />
        <feDiffuseLighting in="lumps" surfaceScale={0.9} diffuseConstant={1.08} lightingColor="#ffffff" result="relief">
          <feDistantLight azimuth={235} elevation={60} />
        </feDiffuseLighting>
        <feColorMatrix in="fine" type="saturate" values="0" result="fineGray" />
        <feComponentTransfer in="fineGray" result="fibres">
          <feFuncR type="linear" slope={0.45} intercept={0.74} />
          <feFuncG type="linear" slope={0.45} intercept={0.74} />
          <feFuncB type="linear" slope={0.45} intercept={0.74} />
          <feFuncA type="linear" slope={0} intercept={1} />
        </feComponentTransfer>
        <feBlend in="fibres" in2="relief" mode="multiply" result="tex" />
        <feBlend in="SourceGraphic" in2="tex" mode="multiply" result="textured" />
        <feComposite in="textured" in2="SourceGraphic" operator="in" />
      </filter>

      {/* Glow for stars, moons, lamps and flames. */}
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={14} result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={30} />
      </filter>
    </defs>
  </svg>
);

/** Mix two #rrggbb colours. amount 0 = a, 1 = b. */
export function mix(a: string, b: string, amount: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * amount));
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export const lighter = (c: string, k = 0.45) => mix(c, "#ffffff", k);
export const darker = (c: string, k = 0.3) => mix(c, "#000000", k);

type StitchProps = { d: string; color: string; width?: number; opacity?: number };

/**
 * "classic": light felt and paper. "felt": heavy felt with chunky thread, felt-panel
 * skies. A film sets it once (SongFilm reads `material` from the song spec).
 */
export type Material = "classic" | "felt";
export const MaterialContext = createContext<Material>("classic");
export const useMaterial = () => useContext(MaterialContext);

/** A running stitch: short rounded dashes, slightly lighter than the felt. */
export const Stitch: React.FC<StitchProps> = ({ d, color, width = 2.6, opacity = 0.8 }) => {
  const heavy = useMaterial() === "felt";
  if (!heavy) {
    return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray="8 7" strokeLinecap="round" opacity={opacity} />;
  }
  // Thicker thread that sits on the felt: a soft shadow under each stitch.
  const w = width * 1.45;
  return (
    <g opacity={Math.min(1, opacity + 0.1)}>
      <path d={d} fill="none" stroke="#000000" strokeOpacity={0.28} strokeWidth={w} strokeDasharray="11 8" strokeLinecap="round" transform="translate(1 1.6)" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeDasharray="11 8" strokeLinecap="round" />
    </g>
  );
};

/** Group that gives its children the felt material. */
export const Felt: React.FC<{ children: React.ReactNode; flat?: boolean; soft?: boolean; opacity?: number }> = ({
  children,
  flat,
  soft,
  opacity,
}) => {
  const heavy = useMaterial() === "felt";
  const id = heavy ? (flat ? "felt-heavy-flat" : "felt-heavy") : flat ? "felt-flat" : soft ? "felt-soft" : "felt";
  return (
    <g filter={`url(#${id})`} opacity={opacity}>
      {children}
    </g>
  );
};

export const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

type EllipseProps = {
  cx: number;
  cy: number;
  rx: number;
  ry?: number;
  fill: string;
  stitch?: boolean | string;
  inset?: number;
};

/** Felt ellipse (or circle) with an inset stitch. Use inside <Felt>. */
export const FeltEllipse: React.FC<EllipseProps> = ({ cx, cy, rx, ry = rx, fill, stitch = true, inset = 10 }) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
    {stitch && rx > inset * 2 && ry > inset * 2 ? (
      <Stitch
        d={ellipsePath(cx, cy, rx - inset, ry - inset)}
        color={typeof stitch === "string" ? stitch : lighter(fill)}
      />
    ) : null}
  </g>
);

/** Five-point star path centred on (cx, cy). */
export function starPath(cx: number, cy: number, r: number, inner = 0.48) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * inner;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M ${pts.join(" L ")} Z`;
}

/** Sample a function into a smooth SVG path (Catmull-Rom to Bézier). */
export function smoothPath(points: [number, number][], close = false): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return close ? d + " Z" : d;
}

/** Deterministic random numbers, so every render of a scene is identical. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
