import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  Character,
  type CharacterSpec,
  hop,
  hops,
  ramp,
  Stage,
  stepBob,
  Thing,
  usePop,
  useScene,
  walk,
  World,
  WORLDS,
  type WorldName,
} from "../../kit/index.ts";

// Template: bedtime (worry → a friend helps → try → did it → goodnight).
// Swap the cast or the world here; every scene follows.
// `as` keeps the type wide, so comparisons still type-check after you change it.
const WORLD = "__WORLD__" as WorldName;
const HERO: CharacterSpec = { kind: "__KIND__" };
const FRIEND: CharacterSpec = { kind: "__FRIEND_KIND__" };

const ground = WORLDS[WORLD].groundAt;
const THING = WORLDS[WORLD].thing;
const HERO_X = 760;
const FRIEND_X = 1160;

export const Home: React.FC = () => (
  <Stage>
    <Camera move="push" focus={[HERO_X, ground(HERO_X) - 150]} amount={0.8}>
      <World name={WORLD} />
      <Character spec={HERO} x={HERO_X} y={ground(HERO_X)} look={0.2} />
      <World name={WORLD} layer="front" />
    </Camera>
  </Stage>
);

export const Worry: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const worried = s.word("worried", 0, s.lineStart(0));
  const shiver = frame > worried ? 3 * Math.sin(frame * 1.3) * Math.max(0, 1 - (frame - worried) / (s.fps * 1.5)) : 0;
  const x = 960;
  return (
    <Stage>
      <Camera move="pull" focus={[x, ground(x) - 200]} amount={1.4}>
        <World name={WORLD} />
        <Character spec={HERO} x={x} y={ground(x)} scale={1.3} look={-0.35} tilt={shiver} bob={0.2} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Friend: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const fx = walk(frame, 2150, FRIEND_X, s.lineStart(0), s.lineEnd(0));
  const look = interpolate(frame, [s.lineStart(0), s.lineEnd(0)], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Stage>
      <Camera move="drift-left" amount={0.5}>
        <World name={WORLD} />
        <Character spec={HERO} x={HERO_X - 160} y={ground(HERO_X - 160)} look={look} />
        <Character
          spec={FRIEND}
          x={fx}
          y={ground(fx) + stepBob(frame, s.fps, s.lineStart(0), s.lineEnd(0))}
          look={-0.6}
          flap={frame > s.lineStart(1) ? 0.35 : 0}
        />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Try: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const counts = s.words(["One", "two", "three"]);
  const lift = hops(frame, s.fps, [counts[0], counts[1]], 40) + hop(frame, s.fps, counts[2] ?? s.lineStart(2), 110, 0.6);
  return (
    <Stage>
      <Camera move="push" focus={[960, ground(960) - 200]} amount={0.6}>
        <World name={WORLD} />
        <Character spec={HERO} x={HERO_X} y={ground(HERO_X) + lift} look={0.4} flap={lift < -5 ? 0.8 : 0} />
        <Character spec={FRIEND} x={FRIEND_X} y={ground(FRIEND_X)} look={-0.5} flap={0.4} bob={0.8} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

const BURST = [
  [-300, -420],
  [-140, -540],
  [60, -580],
  [250, -500],
  [380, -360],
];

export const DidIt: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const did = s.word("did", 0, s.lineStart(0));
  const burst = usePop(did, 10);
  const lift = hop(frame, s.fps, did - 4, 130, 0.7);
  return (
    <Stage>
      <Camera move="push" focus={[960, ground(960) - 250]} amount={0.9} shakeAt={did}>
        <World name={WORLD} />
        {BURST.map(([dx, dy], i) => (
          <Thing key={i} kind={THING} x={960 + dx * burst} y={ground(960) + dy * burst} size={42} pop={burst} glow />
        ))}
        <Character spec={HERO} x={HERO_X + 60} y={ground(HERO_X + 60) + lift} look={0.3} flap={lift < -5 ? 1 : 0.2} />
        <Character spec={FRIEND} x={FRIEND_X + 40} y={ground(FRIEND_X + 40) + hop(frame, s.fps, did + 6, 60)} look={-0.4} flap={0.6} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Goodnight: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const night = s.word("goodnight", 0, s.lineStart(1));
  const sleepy = ramp(frame, night, s.duration - s.fps * 0.8);
  const x1 = 860;
  const x2 = 1080;
  return (
    <Stage>
      <Camera move="push" focus={[970, ground(970) - 180]} amount={1}>
        <World name={WORLD} />
        <Character spec={HERO} x={x1} y={ground(x1)} look={0.3 * (1 - sleepy)} sleepy={sleepy * 0.95} tilt={6 * sleepy} bob={0.3} />
        <Character spec={FRIEND} x={x2} y={ground(x2)} look={-0.3 * (1 - sleepy)} sleepy={sleepy * 0.95} tilt={-6 * sleepy} bob={0.3} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const scenes = {
  home: Home,
  worry: Worry,
  friend: Friend,
  try: Try,
  "did-it": DidIt,
  goodnight: Goodnight,
};
