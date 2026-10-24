import React from "react";
import { useCurrentFrame } from "remotion";
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

// Template: a little adventure (set off → meet a friend → find a treasure → share → home).
// Swap the cast or the world here; every scene follows.
// `as` keeps the type wide, so comparisons still type-check after you change it.
const WORLD = "__WORLD__" as WorldName;
const HERO: CharacterSpec = { kind: "__KIND__" };
const FRIEND: CharacterSpec = { kind: "__FRIEND_KIND__" };

const ground = WORLDS[WORLD].groundAt;
const TREASURE = WORLDS[WORLD].thing;

export const Ready: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const go = s.word("adventure", 0, s.lineEnd(1));
  return (
    <Stage>
      <Camera move="push" focus={[700, ground(700) - 160]} amount={0.8}>
        <World name={WORLD} />
        <Character spec={HERO} x={700} y={ground(700) + hop(frame, s.fps, go, 90)} look={0.5} flap={frame > go ? 0.7 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const OffWeGo: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const h = s.words(["hop", "hop", "hop"]);
  const x = walk(frame, 260, 1500, s.lineStart(0), s.duration - s.fps * 0.4);
  return (
    <Stage>
      <Camera move="drift-right" amount={1}>
        <World name={WORLD} />
        <Character
          spec={HERO}
          x={x}
          y={ground(x) + hops(frame, s.fps, h, 70) + stepBob(frame, s.fps, s.lineStart(0), (h[0] ?? s.lineStart(1)) - 2)}
          look={0.8}
          tilt={4}
        />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const NewFriend: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const hx = walk(frame, -150, 720, 0, s.lineEnd(0) - s.fps * 0.5);
  const hello = s.word("hello", 0, s.lineStart(1));
  return (
    <Stage>
      <Camera move="push" focus={[960, ground(960) - 180]} amount={0.6}>
        <World name={WORLD} />
        <Character spec={HERO} x={hx} y={ground(hx) + stepBob(frame, s.fps, 0, s.lineEnd(0) - s.fps * 0.5)} look={0.6} />
        <Character spec={FRIEND} x={1200} y={ground(1200) + hop(frame, s.fps, hello, 60)} look={-0.6} flap={frame > hello ? 0.6 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Treasure: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const found = s.word("treasure", 0, s.lineStart(1));
  const shine = usePop(found - 4, 9);
  return (
    <Stage>
      <Camera move="push" focus={[960, ground(960) - 220]} amount={1} shakeAt={found}>
        <World name={WORLD} />
        <Thing kind={TREASURE} x={960} y={ground(960) - 120} size={80} pop={shine} glow />
        <Character spec={HERO} x={640} y={ground(640) + hop(frame, s.fps, found, 80)} look={0.7} flap={frame > found ? 0.8 : 0} />
        <Character spec={FRIEND} x={1280} y={ground(1280) + hop(frame, s.fps, found + 5, 80)} look={-0.7} flap={frame > found ? 0.8 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Sharing: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const half = s.word("half", 0, s.lineStart(0) + s.seconds(1.5));
  const split = ramp(frame, half, half + s.fps * 0.8);
  const y = ground(960) - 120;
  return (
    <Stage>
      <Camera move="still">
        <World name={WORLD} />
        <Thing kind={TREASURE} x={960 - 260 * split} y={y - 40 * Math.sin(Math.PI * split)} size={80 - 25 * split} glow />
        {split > 0 ? <Thing kind={TREASURE} x={960 + 260 * split} y={y - 40 * Math.sin(Math.PI * split)} size={55} glow /> : null}
        <Character spec={HERO} x={560} y={ground(560)} look={0.4} flap={split > 0.9 ? 0.4 : 0} />
        <Character spec={FRIEND} x={1360} y={ground(1360)} look={-0.4} flap={split > 0.9 ? 0.4 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const HomeAgain: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const bedtime = WORLDS[WORLD].mood === "bedtime";
  const end = ramp(frame, s.lineStart(1), s.duration - s.fps * 0.6);
  return (
    <Stage>
      <Camera move="pull" focus={[960, ground(960) - 180]} amount={0.9}>
        <World name={WORLD} />
        <Character spec={HERO} x={860} y={ground(860) + (bedtime ? 0 : hop(frame, s.fps, s.lineStart(1), 60))} look={0.3} sleepy={bedtime ? end * 0.9 : 0} flap={bedtime ? 0 : 0.5} />
        <Character spec={FRIEND} x={1080} y={ground(1080) + (bedtime ? 0 : hop(frame, s.fps, s.lineStart(1) + 5, 60))} look={-0.3} sleepy={bedtime ? end * 0.9 : 0} flap={bedtime ? 0 : 0.5} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const scenes = {
  ready: Ready,
  "off-we-go": OffWeGo,
  "new-friend": NewFriend,
  treasure: Treasure,
  sharing: Sharing,
  "home-again": HomeAgain,
};
