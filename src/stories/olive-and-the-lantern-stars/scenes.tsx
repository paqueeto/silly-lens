import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  Boat,
  Branch,
  branchTopY,
  Camera,
  Cloud,
  Critter,
  Fireflies,
  HangingStar,
  Hills,
  Island,
  Lighthouse,
  Moon,
  OakTree,
  Owl,
  PineTree,
  ramp,
  Sky,
  Sparkles,
  Stage,
  useScene,
  usePop,
  WaveBand,
  wobble,
} from "../../kit/index.ts";

// One look per character, reused in every scene.
const OLIVE = { color: "#8a6a9e", belly: "#ecdcbc", face: "#f5e9d2" };
const NIGHT = { top: "#12163a", bottom: "#3b3f7c" };
const SEA = ["#23396f", "#2c4f8f", "#3866a8", "#4a80c0"];

const NightBackdrop: React.FC<{ moon?: [number, number]; seed?: number }> = ({ moon = [1560, 220], seed = 1 }) => (
  <>
    <Sky top={NIGHT.top} bottom={NIGHT.bottom} />
    <Sparkles count={46} seed={seed} />
    <Moon x={moon[0]} y={moon[1]} r={92} />
    <Cloud x={300} y={250} w={340} color="#5a5f9e" speed={10} seed={2} />
    <Cloud x={1250} y={420} w={260} color="#4d5290" speed={7} seed={5} />
  </>
);

const Sea: React.FC<{ y?: number }> = ({ y = 820 }) => (
  <>
    <WaveBand y={y} color={SEA[0]} amp={14} length={300} speed={-14} />
    <WaveBand y={y + 60} color={SEA[1]} amp={16} length={260} speed={18} phase={80} />
    <WaveBand y={y + 130} color={SEA[2]} amp={18} length={230} speed={-22} phase={30} />
    <WaveBand y={y + 205} color={SEA[3]} amp={20} length={210} speed={26} phase={120} />
  </>
);

/** Small dark owls flying off across the sky, starting at `at`. */
const OtherOwls: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useScene();
  const flock = [
    { delay: 0, y: 470, s: 0.42 },
    { delay: 10, y: 400, s: 0.36 },
    { delay: 22, y: 520, s: 0.32 },
  ];
  return (
    <>
      {flock.map((o, i) => {
        const t = (frame - at - o.delay) / fps;
        if (t < 0) return null;
        const x = 820 + t * 330;
        const y = o.y - t * 70 + 14 * Math.sin(t * 5 + i);
        return <Owl key={i} x={x} y={y} scale={o.s} color="#4b3f78" belly="#8f84b8" face="#a59ccb" flap={1} tilt={8} bob={0} />;
      })}
    </>
  );
};

export const Oak: React.FC = () => {
  const s = useScene();
  const flew = s.word("flew", 0, s.lineStart(1));
  const frame = useCurrentFrame();
  const look = interpolate(frame, [flew, flew + 20], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Camera move="drift-right" amount={0.6}>
        <NightBackdrop />
        <Hills y={900} color="#262c5e" height={60} seed={3} />
        <PineTree x={1350} y={930} size={220} color="#1f3d45" />
        <PineTree x={1500} y={940} size={160} color="#24474f" />
        <PineTree x={1780} y={930} size={260} color="#1f3d45" />
        <Hills y={1000} color="#1c3f3c" height={40} seed={8} />
        <OtherOwls at={flew} />
        <OakTree x={330} ground={1060} branchTo={1020} />
        <Owl x={770} y={584} {...OLIVE} look={look} />
      </Camera>
    </Stage>
  );
};

export const Small: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const small = s.word("small", 0, s.lineEnd(1));
  const shiver = frame > small ? 3 * Math.sin(frame * 1.3) * Math.max(0, 1 - (frame - small) / (s.fps * 1.2)) : 0;
  const from: [number, number] = [-80, 880];
  const to: [number, number] = [1500, 860];
  return (
    <Stage>
      <Camera move="pull" focus={[960, 760]} amount={1.6}>
        <Sky top="#0c0f2c" bottom="#2b2f66" />
        <Sparkles count={70} seed={9} area={[0, 0, 1920, 700]} />
        <Moon x={1600} y={180} r={70} />
        <Cloud x={200} y={330} w={300} color="#3f4482" speed={8} seed={7} />
        <Branch from={from} to={to} thickness={60} leaves={4} />
        <Owl x={960} y={branchTopY(from, to, 960) + 4} {...OLIVE} scale={1.35} look={-0.25} tilt={shiver} bob={0.3} />
      </Camera>
    </Stage>
  );
};

const SKY_STARS = [
  { x: 180, len: 260, size: 52 },
  { x: 400, len: 150, size: 44 },
  { x: 620, len: 330, size: 58 },
  { x: 860, len: 450, size: 48 },
  { x: 1080, len: 380, size: 60 },
  { x: 1300, len: 170, size: 46 },
  { x: 1520, len: 300, size: 54 },
  { x: 1740, len: 210, size: 46 },
];

export const Watching: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const starsAt = s.word("stars", 0, s.lineStart(0));
  const help = s.word("help", 0, s.lineStart(1));
  return (
    <Stage>
      <Camera move="rise" amount={0.8}>
        <Sky top="#151a44" bottom="#4a4f8f" />
        <Sparkles count={60} seed={4} />
        <Cloud x={200} y={760} w={420} color="#6a6fae" speed={9} seed={3} />
        <Cloud x={1100} y={860} w={520} color="#5d62a3" speed={6} seed={6} />
        <Cloud x={1650} y={700} w={300} color="#7378b6" speed={11} seed={8} />
        {SKY_STARS.map((st, i) => {
          const drop = ramp(frame, starsAt - 30 + i * 3, starsAt + 6 + i * 3);
          const lean = Math.max(0, Math.sin(((frame - help - i * 2) / s.fps) * Math.PI * 1.5)) * (frame > help && frame < help + s.fps ? 1 : 0);
          return (
            <g key={i} transform={`translate(0 ${-lean * 24})`}>
              <HangingStar x={st.x} length={st.len} size={st.size} lit={0.4 + 0.6 * drop} drop={drop} seed={i + 1} face />
            </g>
          );
        })}
      </Camera>
    </Stage>
  );
};

const ROW = [
  { x: 820, len: 470, word: "One" },
  { x: 1180, len: 400, word: "Two" },
  { x: 1540, len: 330, word: "Three" },
];

export const Row: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const times = s.words(ROW.map((r) => r.word));
  const from: [number, number] = [-60, 700];
  const to: [number, number] = [470, 690];
  const lastStar = times[2] ?? s.lineStart(2);
  const look = interpolate(frame, [lastStar, lastStar + 20], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Camera move="push" focus={[1100, 560]} amount={0.7}>
        <NightBackdrop moon={[1720, 160]} seed={12} />
        <Sea y={830} />
        {ROW.map((r, i) => {
          const at = times[i] ?? s.lineStart(i);
          const drop = ramp(frame, at - 6, at + 18);
          return <HangingStar key={i} x={r.x} length={r.len} size={58} drop={drop} lit={drop} seed={i + 3} face />;
        })}
        <Branch from={from} to={to} thickness={52} leaves={3} />
        <Owl x={300} y={branchTopY(from, to, 300) + 4} {...OLIVE} scale={0.9} look={look} />
      </Camera>
    </Stage>
  );
};

/** Points Olive flies through: the branch, then each star, then off-screen. */
const PATH: [number, number][] = [
  [300, branchTopY([-60, 720], [430, 700], 300) + 4],
  [760, 590],
  [1120, 520],
  [1480, 450],
  [2150, 330],
];

function along(points: [number, number][], t: number): [number, number] {
  const k = Math.min(points.length - 1.0001, Math.max(0, t * (points.length - 1)));
  const i = Math.floor(k);
  const f = k - i;
  const e = f * f * (3 - 2 * f);
  return [points[i][0] + (points[i + 1][0] - points[i][0]) * e, points[i][1] + (points[i + 1][1] - points[i][1]) * e];
}

export const Flight: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const flew = s.word("flew", 0, s.lineStart(1));
  const end = s.duration - s.fps * 0.6;
  const t = ramp(frame, flew, end, (x) => x);
  const [x, y] = along(PATH, t);
  const breath = s.lineStart(0);
  const inhale = frame < flew ? 1 + 0.06 * Math.sin(Math.min(1, (frame - breath) / (s.fps * 1.6)) * Math.PI) : 1;
  const flying = frame >= flew;
  const from: [number, number] = [-60, 720];
  const to: [number, number] = [430, 700];
  const takeoff = usePop(flew);
  return (
    <Stage>
      <Camera move="drift-left" amount={0.8}>
        <NightBackdrop moon={[1180, 170]} seed={21} />
        <Lighthouse x={1640} y={790} scale={0.9} />
        <Island x={1640} y={810} w={300} />
        <Sea y={800} />
        <Boat x={620} y={905} scale={0.8} />
        {ROW.map((r, i) => (
          // Stars hang just above the flight path, so Olive passes under each one.
          <HangingStar key={i} x={PATH[i + 1][0]} length={PATH[i + 1][1] - 250} size={50} lit={1} seed={i + 3} face />
        ))}
        <Branch from={from} to={to} thickness={52} leaves={3} />
        <Owl
          x={flying ? x : 300}
          y={flying ? y + 14 * wobble(frame, s.fps, 0.9) : branchTopY(from, to, 300) + 4}
          {...OLIVE}
          scale={0.85 * inhale}
          flap={flying ? 0.9 * takeoff : 0}
          tilt={flying ? 10 : 0}
          look={0.6}
          bob={flying ? 0 : 0.4}
        />
      </Camera>
    </Stage>
  );
};

export const Home: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const friends = s.word("friends", 0, s.lineStart(1));
  const night = s.word("goodnight", 0, s.lineStart(2));
  const sleepy = ramp(frame, night, s.duration - s.fps * 0.8);
  const fireflies = ramp(frame, friends - 10, friends + 20);
  const mouse = usePop(friends + 6, 14);
  const x = 200;
  const ground = 1150;
  const sc = 1.25;
  const hollow = { x: x + 5 * sc, y: ground - 300 * sc, rx: 42 * sc, ry: 62 * sc };
  return (
    <Stage>
      <Camera move="push" focus={[900, 560]} amount={0.8}>
        <NightBackdrop moon={[1500, 210]} seed={31} />
        <Hills y={960} color="#262c5e" height={50} seed={5} />
        <g opacity={fireflies}>
          <Fireflies count={16} seed={6} area={[500, 300, 1300, 600]} />
        </g>
        {[1150, 1400, 1650].map((sx, i) => (
          <HangingStar key={i} x={sx} length={260 + i * 60} size={50} lit={1} seed={i + 3} face />
        ))}
        <OakTree x={x} ground={ground} scale={sc} branchTo={1250} />
        <g>
          <clipPath id="hollow-clip">
            <ellipse cx={hollow.x} cy={hollow.y} rx={hollow.rx} ry={hollow.ry} />
          </clipPath>
          <g clipPath="url(#hollow-clip)">
            <Critter kind="mouse" x={hollow.x} y={hollow.y + hollow.ry + 4 + (1 - mouse) * 90} scale={0.3} look={0.8} sleepy={sleepy} />
          </g>
        </g>
        <Owl x={900} y={ground - 470 * sc - 10} {...OLIVE} look={sleepy > 0 ? 0 : 0.3} sleepy={sleepy * 0.95} bob={0.3 * (1 - sleepy)} />
      </Camera>
    </Stage>
  );
};

export const scenes = {
  oak: Oak,
  small: Small,
  watching: Watching,
  row: Row,
  flight: Flight,
  home: Home,
};
