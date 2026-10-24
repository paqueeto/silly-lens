import React from "react";
import { Felt, H, Stitch, W, smoothPath } from "./felt.tsx";
import {
  Butterflies,
  Cloud,
  Fireflies,
  FlowerPatch,
  Hills,
  Island,
  Lighthouse,
  Moon,
  PineTree,
  RoundTree,
  Sky,
  Snowfall,
  Sparkles,
  Sun,
  WaveBand,
  hillCurve,
} from "./nature.tsx";
import type { Mood } from "../types.ts";
import type { ThingKind } from "./nature.tsx";

// Ready-made settings. A scene draws <World name> behind its characters and
// <World name layer="front"> in front of them, and stands characters on
// groundAt(x). Every world fills the frame, so any template works in any world.

export type WorldName = "night-forest" | "night-sea" | "starry-sky" | "sunny-meadow" | "snowy-hill";

type WorldInfo = {
  mood: Mood;
  /** Phrase for narration: "in a quiet forest". */
  place: string;
  /** What a counting story counts here by default. */
  thing: ThingKind;
  /** y of the ground at x, where characters' feet go. */
  groundAt: (x: number) => number;
};

const meadowGround = hillCurve(905, 35, 4);
const forestGround = hillCurve(930, 30, 8);
const snowGround = hillCurve(915, 40, 6);
/** Sandy shore sloping down into the sea from the left. */
const shoreGround = (x: number) => 860 + Math.max(0, x - 700) * 0.12 + 18 * Math.sin(x / 260);

export const WORLDS: Record<WorldName, WorldInfo> = {
  "night-forest": { mood: "bedtime", place: "in a quiet forest", thing: "star", groundAt: forestGround },
  "night-sea": { mood: "bedtime", place: "by the sleepy sea", thing: "shell", groundAt: shoreGround },
  "starry-sky": { mood: "bedtime", place: "up among the clouds", thing: "star", groundAt: () => 820 },
  "sunny-meadow": { mood: "playful", place: "in a sunny meadow", thing: "flower", groundAt: meadowGround },
  "snowy-hill": { mood: "playful", place: "on a snowy hill", thing: "snowflake", groundAt: snowGround },
};

export const groundAt = (world: WorldName, x: number) => WORLDS[world].groundAt(x);

const NightSky: React.FC<{ seed: number; moon?: [number, number] }> = ({ seed, moon = [1560, 210] }) => (
  <>
    <Sky top="#12163a" bottom="#3b3f7c" />
    <Sparkles count={46} seed={seed} />
    <Moon x={moon[0]} y={moon[1]} r={88} />
    <Cloud x={300} y={240} w={330} color="#5a5f9e" speed={10} seed={2} />
    <Cloud x={1150} y={400} w={250} color="#4d5290" speed={7} seed={5} />
  </>
);

const Back: Record<WorldName, React.FC> = {
  "night-forest": () => (
    <>
      <NightSky seed={11} />
      <Hills y={860} color="#262c5e" height={60} seed={3} />
      <PineTree x={180} y={900} size={260} color="#1f3d45" />
      <PineTree x={1380} y={880} size={220} color="#1f3d45" />
      <PineTree x={1540} y={890} size={160} color="#24474f" />
      <PineTree x={1800} y={880} size={280} color="#1f3d45" />
      <Fireflies count={10} seed={3} area={[0, 500, W, 350]} />
      <Hills y={930} color="#1c3f3c" height={30} seed={8} />
    </>
  ),
  "night-sea": () => (
    <>
      <NightSky seed={21} moon={[1180, 190]} />
      <Lighthouse x={1660} y={790} scale={0.9} />
      <Island x={1660} y={810} w={300} />
      <WaveBand y={800} color="#23396f" amp={14} length={300} speed={-14} />
      <WaveBand y={860} color="#2c4f8f" amp={16} length={260} speed={18} phase={80} />
      <WaveBand y={930} color="#3866a8" amp={18} length={230} speed={-22} phase={30} />
      <Shore />
    </>
  ),
  "starry-sky": () => (
    <>
      <Sky top="#151a44" bottom="#4a4f8f" />
      <Sparkles count={80} seed={4} area={[0, 0, W, H * 0.75]} />
      <Moon x={1650} y={180} r={70} />
      <Cloud x={1300} y={420} w={260} color="#5d62a3" speed={9} seed={8} />
      <Cloud x={100} y={980} w={620} color="#6a6fae" speed={6} seed={3} stitch={false} />
      <Cloud x={900} y={1010} w={760} color="#7378b6" speed={4} seed={6} />
    </>
  ),
  "sunny-meadow": () => (
    <>
      <Sky top="#8fd3f4" bottom="#fdf1d6" />
      <Sun x={1640} y={190} r={85} />
      <Cloud x={250} y={220} w={320} color="#ffffff" speed={12} seed={1} />
      <Cloud x={1000} y={160} w={240} color="#ffffff" speed={8} seed={4} />
      <Hills y={760} color="#9fd08a" height={70} seed={2} />
      <RoundTree x={240} y={790} size={120} color="#5aa05f" />
      <RoundTree x={1460} y={770} size={95} color="#4f9455" />
      <RoundTree x={1580} y={785} size={70} color="#66ad68" />
      <Butterflies count={3} seed={2} area={[300, 380, 1300, 260]} />
      <Hills y={905} color="#79bf6c" height={35} seed={4} stitchColor="#c9edb8" />
    </>
  ),
  "snowy-hill": () => (
    <>
      <Sky top="#6fa3dc" bottom="#c6dcf3" />
      <Sun x={1650} y={180} r={70} face={false} />
      <Cloud x={500} y={200} w={300} color="#ffffff" speed={8} seed={2} />
      <Hills y={760} color="#dde8f6" height={80} seed={7} stitchColor="#ffffff" soft />
      <PineTree x={260} y={800} size={240} color="#2f6a58" snow />
      <PineTree x={420} y={790} size={170} color="#357561" snow />
      <PineTree x={1500} y={780} size={210} color="#2f6a58" snow />
      <Hills y={915} color="#f7f9fd" height={40} seed={6} stitchColor="#c9d8ec" soft />
      <Snowfall count={60} seed={5} />
    </>
  ),
};

const Shore: React.FC = () => {
  const top: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let x = -100; x <= W + 100; x += 40) {
    top.push([x, shoreGround(x)]);
    inner.push([x, shoreGround(x) + 14]);
  }
  return (
    <Felt>
      <path d={`${smoothPath(top)} L ${W + 100} ${H + 100} L -100 ${H + 100} Z`} fill="#e8c98f" />
      <Stitch d={smoothPath(inner)} color="#f7e3b8" />
    </Felt>
  );
};

const Front: Partial<Record<WorldName, React.FC>> = {
  "sunny-meadow": () => <FlowerPatch groundAt={(x) => meadowGround(x) + 60} count={16} seed={9} size={22} />,
  "snowy-hill": () => <Snowfall count={25} seed={12} speed={90} />,
  "starry-sky": () => <Cloud x={1500} y={1060} w={700} color="#8186c2" speed={5} seed={9} />,
};

/** A full setting. Draw it first (layer "back"), then characters, then layer "front". */
export const World: React.FC<{ name: WorldName; layer?: "back" | "front" }> = ({ name, layer = "back" }) => {
  const Layer = layer === "back" ? Back[name] : Front[name];
  return Layer ? <Layer /> : null;
};

export const WORLD_NAMES = Object.keys(WORLDS) as WorldName[];
