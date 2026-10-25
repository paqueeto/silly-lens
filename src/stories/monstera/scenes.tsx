import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Crown,
  CutoutWord,
  Cutout,
  Drop,
  Felt,
  FeltHand,
  H,
  Monstera,
  MonsteraLeaf,
  MossPole,
  Pot,
  ramp,
  rng,
  Stage,
  Stitch,
  useScene,
  W,
  darker,
  lighter,
  type LeafSpec,
} from "../../kit/index.ts";
import { useBeat } from "../../SongFilm.tsx";

// "The Monstera Plant": a stop-motion felt music video. One hero (the plant) on a
// tabletop set; each section is one idea, and every move lands on a sung word or a beat.
// Animated at 12 fps, every piece wrapped in a <Cutout> so it shifts a hair per frame.

const TABLE_Y = 800;
const CX = 960;
/** In choruses and the title the plant stands right of centre; big words take the left. */
const PX = 1260;
const WORD_X = 110;

const SMALL_POT = { w: 210, h: 190 };
const BIG_POT = { w: 340, h: 250 };
/** Soil line for a pot standing on the table. */
const soilY = (h: number) => TABLE_Y + 40 - h + 16;

const LEAVES: LeafSpec[] = [
  { angle: -52, reach: 230, size: 200, seed: 11 },
  { angle: 44, reach: 260, size: 215, seed: 12 },
  { angle: -14, reach: 360, size: 235, seed: 13 },
  { angle: 74, reach: 170, size: 170, seed: 14 },
  { angle: -80, reach: 160, size: 160, seed: 15 },
  { angle: 18, reach: 430, size: 220, seed: 16 },
];
const ALL = LEAVES.map(() => 1);

/** Pure spring-ish pop, safe inside loops. */
function popAt(frame: number, at: number) {
  if (frame < at) return 0;
  const t = frame - at;
  return Math.min(1.1, 1 - Math.exp(-t / 1.4) * Math.cos(t / 1.1));
}

/** Frames of beats 0..n-1 from the section start. */
function useBeats(n: number) {
  const beat = useBeat();
  return Array.from({ length: n }, (_, k) => beat(k));
}

/** 1 on a hit frame, decaying over ~3 frames (punchy at 12 fps). */
function punch(frame: number, hits: number[], len = 3) {
  let p = 0;
  for (const h of hits) if (frame >= h && frame < h + len) p = Math.max(p, 1 - (frame - h) / len);
  return p;
}

/** The tabletop set: felt wall, felt table, a soft spotlight and a vignette. */
const Set: React.FC<{ wall: string; table: string; spot?: number; spotX?: number; split?: { color: string; at: number } }> = ({
  wall,
  table,
  spot = 0.6,
  spotX = CX,
  split,
}) => (
  <g>
    <defs>
      <radialGradient id="mst-spot" cx={spotX / W} cy={0.45} r={0.55}>
        <stop offset="0" stopColor="#fff6dc" stopOpacity={0.55 * spot} />
        <stop offset="1" stopColor="#fff6dc" stopOpacity={0} />
      </radialGradient>
      <radialGradient id="mst-vignette" cx={0.5} cy={0.5} r={0.75}>
        <stop offset="0.55" stopColor="#000000" stopOpacity={0} />
        <stop offset="1" stopColor="#000000" stopOpacity={0.5} />
      </radialGradient>
    </defs>
    <rect x={-60} y={-60} width={W + 120} height={TABLE_Y + 60} fill={wall} filter="url(#felt-heavy-flat)" />
    {split ? <rect x={CX} y={-60} width={(W / 2 + 60) * split.at} height={TABLE_Y + 60} fill={split.color} filter="url(#felt-heavy-flat)" /> : null}
    <rect x={-60} y={TABLE_Y} width={W + 120} height={H - TABLE_Y + 60} fill={table} filter="url(#felt-heavy-flat)" />
    <Felt>
      <rect x={-60} y={TABLE_Y - 6} width={W + 120} height={14} fill={darker(table, 0.15)} />
    </Felt>
    <rect x={0} y={0} width={W} height={H} fill="url(#mst-spot)" />
    <rect x={0} y={0} width={W} height={H} fill="url(#mst-vignette)" />
  </g>
);

/** Camera on the set: a slow move plus punch-zooms on hits. */
const Cam: React.FC<{ zoom?: number; tilt?: number; focus?: [number, number]; children: React.ReactNode }> = ({ zoom = 1, tilt = 0, focus = [CX, 560], children }) => (
  <g transform={`translate(${focus[0]} ${focus[1]}) rotate(${tilt}) scale(${zoom}) translate(${-focus[0]} ${-focus[1]})`}>{children}</g>
);

// ---------------------------------------------------------------- intro

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBeats(34);
  const lightOn = frame >= b[2] ? (frame < b[2] + 2 || (frame >= b[2] + 3 && frame < b[2] + 4) ? 0.3 : 1) : 0;
  const unfurl = Math.min(1, b.filter((x) => frame >= x && x >= b[20]).length / 8);
  return (
    <Stage background="#101218">
      <Set wall="#191c26" table="#262833" spot={lightOn} />
      <Cam zoom={1 + 0.04 * ramp(frame, 0, b[33])}>
        <CutoutWord text="THE" x={CX} y={230} size={90} color="#efe0c6" at={b[4]} step={1} seed={1} />
        <CutoutWord text="MONSTERA" x={CX} y={380} size={200} color="#46b878" at={b[8]} step={1} seed={2} />
        <CutoutWord text="PLANT" x={CX} y={560} size={110} color="#efe0c6" at={b[16]} step={1} seed={3} />
        {frame >= b[20] ? (
          <Cutout seed={5}>
            <MonsteraLeaf x={CX} y={TABLE_Y + 90} size={240} unfurl={0.15 + 0.85 * unfurl} split={unfurl} holes={unfurl} seed={21} color="#2f8f5b" />
          </Cutout>
        ) : null}
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- verse 1

export const TooTight: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(30);
  const curl = s.word("curl", 0, s.lineStart(1));
  const light = s.word("light", 0, s.lineEnd(1));
  const roots = s.word("roots", 0, s.lineStart(2));
  const fight = s.word("fight", 0, s.lineEnd(2));
  const gasp = punch(frame, b.filter((_, k) => k % 2 === 0), 3);
  const wilt = 0.45 + 0.3 * ramp(frame, curl, curl + 8);
  const spotX = interpolate(frame, [light - 2, light + 6], [CX, 1560], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = frame >= fight && frame < fight + 8 ? (frame % 2 ? 6 : -6) : 0;
  const soil = soilY(SMALL_POT.h);
  return (
    <Stage>
      <Set wall="#a2a99c" table="#857a6c" spot={0.7} spotX={spotX} />
      <Cam zoom={1 + 0.14 * ramp(frame, 0, s.duration)} focus={[CX, 640]}>
        <g transform={`translate(${shake} 0)`}>
          <Monstera x={CX} y={soil} leaves={LEAVES.slice(0, 5)} grow={ALL} split={0.35} holes={0} wilt={wilt} color="#4f8a5a" scale={0.8 * (1 - 0.03 * gasp)} />
          <Cutout seed={30}>
            <Pot x={CX} y={soil} w={SMALL_POT.w} h={SMALL_POT.h} squeeze={gasp} roots={ramp(frame, roots, roots + 14)} />
          </Cutout>
        </g>
      </Cam>
    </Stage>
  );
};

export const LetYouGo: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const lost = s.word("lost", 0, s.lineStart(0) + 20);
  const go = s.word("go", 0, s.lineEnd(1));
  const letStart = s.word("nearly", 0, s.lineStart(1));
  // The pot inches towards the edge, one nudge per beat: stop-motion steps.
  const nudges = b.filter((x) => x >= letStart && x <= go).length;
  const potX = CX + Math.min(nudges, 12) * 38;
  const teeter = frame >= go ? 7 + 2 * Math.sin(frame) : 0;
  const soil = soilY(SMALL_POT.h);
  // One leaf lets go on "lost" and drops to the table in a few hops.
  const fall = ramp(frame, lost, lost + 10, (t) => t);
  const fx = CX - 170 - 60 * fall;
  const fy = soil - 260 + (TABLE_Y + 30 - (soil - 260)) * fall;
  const catchAt = s.duration - 18;
  const hand = ramp(frame, catchAt, catchAt + 8);
  return (
    <Stage>
      <Set wall="#6c726b" table="#5a5047" spot={0.45} spotX={potX} />
      <Cam tilt={-3}>
        <g transform={`rotate(${teeter} ${potX + SMALL_POT.w / 2} ${TABLE_Y + 40})`}>
          <Monstera x={potX} y={soil} leaves={LEAVES.slice(1, 5)} grow={ALL} split={0.3} holes={0} wilt={0.92} color="#6f8a5c" scale={0.78} />
          <Cutout seed={31}>
            <Pot x={potX} y={soil} w={SMALL_POT.w} h={SMALL_POT.h} roots={1} />
          </Cutout>
        </g>
        {frame >= lost ? (
          <Cutout seed={32}>
            <MonsteraLeaf x={fx} y={fy} size={150} angle={-60 + 140 * fall} split={0.3} holes={0} wilt={0.8} color="#7c8a5a" seed={11} />
          </Cutout>
        ) : null}
        {hand > 0 ? (
          <Cutout seed={33}>
            <FeltHand x={potX + 40} y={-200 + 520 * hand} size={1.1} rotate={180} fingers={[1, 1, 1, 1, 1]} />
          </Cutout>
        ) : null}
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- chorus 1

export const ChorusOne: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const survivor = s.word("survivor", 0, s.lineStart(0) + 18);
  const climber = s.word("climber", 0, s.lineStart(1) + 20);
  const wrong = s.word("wrong", 0, s.lineStart(2));
  const hands = s.word("hands", 0, s.lineEnd(2));
  const thriving = s.word("thriving", 0, s.lineStart(3));
  const grow = LEAVES.map((_, i) => ramp(frame, b[i * 2] ?? 0, (b[i * 2] ?? 0) + 6));
  const opened = ramp(frame, survivor, survivor + 4);
  const zoom = 1 + 0.06 * punch(frame, b.filter((_, k) => k % 2 === 0));
  // From the wrong soil to the right hands: lifted out, small pot exits, big pot enters, set down.
  const lift = ramp(frame, wrong, wrong + 8);
  const swap = ramp(frame, wrong + 8, hands);
  const down = ramp(frame, hands, hands + 8);
  const potH = swap > 0.5 ? BIG_POT.h : SMALL_POT.h;
  const plantY = soilY(SMALL_POT.h) - 160 * lift + (soilY(BIG_POT.h) - soilY(SMALL_POT.h) + 160) * down;
  const thrive = punch(frame, b.filter((x) => x >= thriving && b.indexOf(x) % 2 === 0), 4);
  const handX = 260 * (1 - Math.min(lift * 2, 1)) + 260 * down;
  return (
    <Stage>
      <Set wall="#ff6b4a" table="#ffc9a3" spot={0.8} />
      <Cam zoom={zoom}>
        {frame >= survivor && frame < thriving ? <CutoutWord text="SURVIVOR" x={WORD_X} y={330} size={150} color="#fff3d6" at={survivor} step={1} seed={7} anchor="start" /> : null}
        {frame >= thriving ? <CutoutWord text="THRIVING" x={WORD_X} y={330} size={150} color="#1f4d3a" at={thriving} step={1} seed={8} anchor="start" /> : null}
        <MossPole x={PX + 70} y={plantY + 10} height={560} grow={ramp(frame, climber - 2, climber + 6)} />
        <Monstera x={PX} y={plantY} leaves={LEAVES} grow={grow} split={opened} holes={opened} color="#2f9a5e" scale={0.85 * (1 + 0.04 * thrive)} />
        {lift > 0 && down < 1 ? (
          <Cutout seed={40}>
            <Felt>
              <ellipse cx={PX} cy={plantY + 40} rx={95} ry={70} fill="#5a3b28" />
            </Felt>
          </Cutout>
        ) : null}
        <Cutout seed={41}>
          {potH === SMALL_POT.h ? (
            <Pot x={PX - 1400 * swap} y={soilY(SMALL_POT.h)} w={SMALL_POT.w} h={SMALL_POT.h} roots={1} />
          ) : (
            <Pot x={PX + 1400 * (1 - swap)} y={soilY(BIG_POT.h)} w={BIG_POT.w} h={BIG_POT.h} color="#e07b4f" />
          )}
        </Cutout>
        {lift > 0 && down < 1 ? (
          <>
            <Cutout seed={42}>
              <FeltHand x={PX - 380 + handX} y={plantY + 60} size={0.9} rotate={90} fingers={[1, 1, 1, 1, 0.5]} />
            </Cutout>
            <Cutout seed={43}>
              <FeltHand x={PX + 380 - handX} y={plantY + 60} size={0.9} rotate={-90} flip fingers={[1, 1, 1, 1, 0.5]} />
            </Cutout>
          </>
        ) : null}
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- verse 2

export const Repot: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(44);
  const tore = s.word("tore", 0, s.lineStart(0));
  const space = s.word("space", 0, s.lineStart(1));
  const drown = s.word("drown", 0, s.lineEnd(1));
  const stretch = s.word("stretch", 0, s.lineStart(2));
  const crownAt = s.word("crown", 0, s.lineEnd(2));
  const soilBig = soilY(BIG_POT.h);
  const lower = ramp(frame, space, space + 8);
  const plantY = soilBig - 220 * (1 - lower);
  const clodBeats = b.filter((x) => x >= tore).slice(0, 5);
  const dropBeats = b.filter((x) => x >= drown - 4).slice(0, 3);
  const tall = 1 + 0.14 * ramp(frame, stretch, stretch + 16);
  const r = rng(5);
  const clods = clodBeats.map((at) => ({ at, dx: (r() - 0.5) * 220, size: 22 + r() * 18 }));
  const crownY = interpolate(frame, [crownAt - 3, crownAt + 2], [-180, plantY - 470 * tall * 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Set wall="#f2d39b" table="#c48d58" spot={0.7} />
      <Cam zoom={1.0 - 0.06 * ramp(frame, stretch, s.duration)} focus={[CX, 620]}>
        <g transform={`translate(${CX} ${plantY}) scale(1 ${tall}) translate(${-CX} ${-plantY})`}>
          <Monstera x={CX} y={plantY} leaves={LEAVES} grow={ALL} color="#2f9a5e" scale={0.85} />
        </g>
        {lower < 1 ? (
          <Cutout seed={50}>
            <Felt>
              <ellipse cx={CX} cy={plantY + 40} rx={95 - 4 * clods.filter((c) => frame >= c.at).length} ry={70} fill="#5a3b28" />
            </Felt>
          </Cutout>
        ) : null}
        {clods.map((c, i) => {
          if (frame < c.at) return null;
          const t = Math.min(1, (frame - c.at) / 5);
          const y = plantY + 60 + (TABLE_Y + 30 - plantY - 60) * t * t;
          return (
            <Cutout key={i} seed={51 + i}>
              <Felt>
                <ellipse cx={CX + c.dx * (0.4 + 0.6 * t)} cy={y} rx={c.size} ry={c.size * 0.75} fill="#4a3426" />
              </Felt>
            </Cutout>
          );
        })}
        <Cutout seed={57}>
          <Pot x={CX} y={soilBig} w={BIG_POT.w} h={BIG_POT.h} color="#e07b4f" />
        </Cutout>
        {dropBeats.map((at, i) => {
          if (frame < at || frame > at + 8) return null;
          const t = (frame - at) / 8;
          return <Drop key={i} x={CX - 60 + i * 60} y={-60 + (soilBig + 60) * t} size={0.9} />;
        })}
        {frame >= crownAt - 3 ? (
          <Cutout seed={58}>
            <Crown x={CX - 20} y={crownY} size={0.75} />
          </Cutout>
        ) : null}
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- chorus 2

const PALETTE = [
  { wall: "#ff6b4a", table: "#ffc9a3", word: "#fff3d6" },
  { wall: "#ffc93d", table: "#f5e3a8", word: "#1f4d3a" },
  { wall: "#3fb4a6", table: "#a8e0d6", word: "#fff3d6" },
  { wall: "#e86fb0", table: "#f6c3dc", word: "#fff3d6" },
];

export const ChorusTwo: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(48);
  const beatNo = b.filter((x) => frame >= x).length;
  const card = PALETTE[Math.floor(beatNo / 2) % PALETTE.length];
  const words: { word: string; text: string }[] = [
    { word: "survivor", text: "SURVIVOR" },
    { word: "climber", text: "CLIMBER" },
    { word: "hands", text: "RIGHT HANDS" },
    { word: "thriving", text: "THRIVING" },
  ];
  const times = words.map((w) => s.word(w.word, 0, -1));
  let current = -1;
  times.forEach((t, i) => {
    if (t >= 0 && frame >= t) current = i;
  });
  const zoom = 1 + 0.07 * punch(frame, b.filter((_, k) => k % 2 === 0));
  // Mandala: eight leaves orbit the plant, stepping 22.5° on each beat.
  const step = beatNo * 22.5;
  const ring = popAt(frame, b[1] ?? 0);
  const soil = soilY(BIG_POT.h);
  return (
    <Stage>
      <Set wall={card.wall} table={card.table} spot={0.8} />
      <Cam zoom={zoom}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = ((i * 45 + step) * Math.PI) / 180;
          const x = PX + Math.cos(a) * 340 * ring;
          const y = 470 + Math.sin(a) * 300 * ring;
          return (
            <Cutout key={i} seed={70 + i}>
              <MonsteraLeaf x={x} y={y} size={170 * ring} angle={i * 45 + step + 90} color={i % 2 ? "#2f9a5e" : "#1f7a4a"} seed={70 + i} />
            </Cutout>
          );
        })}
        {current >= 0 ? (
          <CutoutWord
            key={current}
            text={words[current].text}
            x={WORD_X}
            y={330}
            size={words[current].text.length > 8 ? 112 : 150}
            color={card.word}
            at={times[current]}
            step={1}
            seed={80 + current}
            anchor="start"
          />
        ) : null}
        <Monstera x={PX} y={soil} leaves={LEAVES} grow={ALL} color="#2f9a5e" scale={0.82} />
        <Cutout seed={88}>
          <Crown x={PX - 20} y={soil - 380} size={0.6} />
        </Cutout>
        <Cutout seed={89}>
          <Pot x={PX} y={soil} w={BIG_POT.w} h={BIG_POT.h} color="#e07b4f" />
        </Cutout>
      </Cam>
    </Stage>
  );
};

// ---------------------------------------------------------------- bridge

export const Bridge: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const fits = s.word("fits", 0, s.lineEnd(0));
  const broken = s.word("broken", 0, s.lineStart(1));
  const wits = s.word("wits", 0, s.lineEnd(1));
  const green = s.word("green", 0, s.lineStart(2) + 12);
  // We grow in fits: the stem jumps on every fourth beat, holds still in between.
  const jumps = b.filter((x, k) => k % 4 === 0 && frame >= x && x >= fits - 30).length;
  const height = Math.min(0.78, 0.25 + jumps * 0.11);
  const crack = ramp(frame, broken, broken + 6);
  const apart = ramp(frame, broken + 8, broken + 14) * 22;
  const holes = ramp(frame, wits, wits + 6);
  const greenAt = ramp(frame, green, green + 10);
  const leafColor = greenAt > 0 ? interpolateColor("#8a8f8c", "#2f9a5e", greenAt) : "#8a8f8c";
  const soil = soilY(SMALL_POT.h);
  return (
    <Stage>
      <Set wall="#8b8e93" table="#6d7075" spot={0.5} split={{ color: "#3f8f5e", at: greenAt }} />
      <Cam zoom={1.05} focus={[CX, 640]}>
        <Cutout seed={90}>
          <Felt>
            <path d={`M ${CX} ${soil} Q ${CX + 30} ${soil - 220 * height} ${CX - 10} ${soil - 440 * height}`} stroke={darker(leafColor, 0.2)} strokeWidth={14} fill="none" strokeLinecap="round" />
          </Felt>
          <MonsteraLeaf x={CX - 10} y={soil - 440 * height} size={170 + 140 * height} angle={-8} split={0.4 + 0.6 * holes} holes={holes} color={leafColor} seed={91} />
        </Cutout>
        <g transform={`translate(${-apart} 0) rotate(${-apart / 6} ${CX} ${TABLE_Y + 40})`}>
          <Cutout seed={92}>
            <Pot x={CX} y={soil} w={SMALL_POT.w} h={SMALL_POT.h} color="#9a9a9a" crack={crack} />
          </Cutout>
        </g>
      </Cam>
    </Stage>
  );
};

function interpolateColor(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  return "#" + [16, 8, 0].map((s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * k).toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------- outro

const JUNGLE = (() => {
  const r = rng(2026);
  return Array.from({ length: 30 }, (_, i) => ({
    x: 80 + r() * (W - 160),
    y: 80 + r() * (TABLE_Y - 40),
    size: 190 + r() * 210,
    angle: (r() - 0.5) * 140,
    color: ["#1f7a4a", "#2f9a5e", "#3fae6a", "#17603a"][i % 4],
    seed: 200 + i,
  }));
})();

export const Jungle: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const clearAt = s.duration - 14;
  const shown = b.filter((x) => frame >= x).length;
  const cleared = frame >= clearAt ? frame - clearAt : 0;
  const count = Math.max(0, Math.min(JUNGLE.length, shown) - cleared * 3);
  const zoom = 1 + 0.06 * punch(frame, b.filter((_, k) => k % 2 === 0));
  const soil = soilY(BIG_POT.h);
  return (
    <Stage>
      <Set wall="#1f4d3a" table="#2c3a2f" spot={0.6} />
      <Cam zoom={zoom}>
        {JUNGLE.slice(0, count).map((l, i) => (
          <Cutout key={i} seed={l.seed}>
            <MonsteraLeaf x={l.x} y={l.y + l.size * 0.5} size={l.size * Math.min(1, popAt(frame, b[i] ?? 0))} angle={l.angle} color={l.color} seed={l.seed} />
          </Cutout>
        ))}
        <Monstera x={CX} y={soil} leaves={LEAVES} grow={ALL} color="#3fae6a" scale={0.82} />
        <Cutout seed={98}>
          <Crown x={CX - 20} y={soil - 380} size={0.6} />
        </Cutout>
        <Cutout seed={99}>
          <Pot x={CX} y={soil} w={BIG_POT.w} h={BIG_POT.h} color="#e07b4f" />
        </Cutout>
      </Cam>
    </Stage>
  );
};

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const soil = soilY(BIG_POT.h);
  return (
    <Stage>
      <Set wall="#efe0c6" table="#c9a77e" spot={0.7} />
      <Cam zoom={1 + 0.03 * (frame / fps)}>
        <CutoutWord text="THE" x={520} y={250} size={90} color="#1f4d3a" at={0} step={1} seed={9} />
        <CutoutWord text="MONSTERA" x={520} y={410} size={160} color="#2f9a5e" at={3} step={1} seed={10} />
        <CutoutWord text="PLANT" x={520} y={580} size={110} color="#1f4d3a" at={11} step={1} seed={11} />
        <Monstera x={PX + 140} y={soil} leaves={LEAVES} grow={ALL} color="#2f9a5e" scale={0.82} />
        <Cutout seed={101}>
          <Crown x={PX + 140 - 20} y={soil - 380} size={0.6} />
        </Cutout>
        <Cutout seed={102}>
          <Pot x={PX + 140} y={soil} w={BIG_POT.w} h={BIG_POT.h} color="#e07b4f" />
        </Cutout>
        <Stitch d="M 180 670 H 860" color={lighter("#1f4d3a", 0.3)} />
      </Cam>
    </Stage>
  );
};

export const scenes: Record<string, React.FC> = {
  intro: Intro,
  "too-tight": TooTight,
  "let-you-go": LetYouGo,
  "chorus-1": ChorusOne,
  repot: Repot,
  "chorus-2": ChorusTwo,
  bridge: Bridge,
  jungle: Jungle,
  title: Title,
};
