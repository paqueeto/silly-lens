import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  Camera,
  Character,
  type CharacterSpec,
  hop,
  hops,
  Stage,
  Thing,
  type ThingKind,
  usePop,
  useScene,
  World,
  WORLDS,
  type WorldName,
} from "../../kit/index.ts";

// Template: counting 1 to 5. Swap the cast, the world or what gets counted here.
// `as` keeps the type wide, so comparisons still type-check after you change it.
const WORLD = "__WORLD__" as WorldName;
const HERO: CharacterSpec = { kind: "__KIND__" };
const THING = "__THING_KIND__" as ThingKind;

const ground = WORLDS[WORLD].groundAt;
const HERO_X = 330;

/** Where the five things sit: a gentle arc to the right of the hero. */
const SPOTS = [0, 1, 2, 3, 4].map((i) => {
  const x = 680 + i * 260;
  return { x, y: ground(x) - 300 - 70 * Math.sin((i / 4) * Math.PI) };
});

const NUMBERS = ["One", "Two", "Three", "Four", "five"];

/** Thing i springs in at frame `at` (null = already there). */
const CountThing: React.FC<{ i: number; at: number | null; bounceAt?: number | null }> = ({ i, at, bounceAt = null }) => {
  const frame = useCurrentFrame();
  const { fps } = useScene();
  const p = usePop(at ?? -1000);
  const b = bounceAt !== null ? hop(frame, fps, bounceAt, 40, 0.35) : 0;
  return <Thing kind={THING} x={SPOTS[i].x} y={SPOTS[i].y + b} size={58} pop={at === null ? 1 : p} glow={THING === "star"} />;
};

/** The hero turns to look at whichever thing appeared last. */
function lookToward(frame: number, times: (number | null)[]) {
  let target = 0;
  times.forEach((t, i) => {
    if (t !== null && frame >= t) target = (SPOTS[i].x - HERO_X) / 1400;
  });
  return Math.min(1, 0.3 + target);
}

export const Hello: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const together = s.word("together", 0, s.lineEnd(1));
  return (
    <Stage>
      <Camera move="push" focus={[760, ground(760) - 150]} amount={0.7}>
        <World name={WORLD} />
        <Character spec={HERO} x={760} y={ground(760) + hop(frame, s.fps, together, 80)} look={0.1} flap={frame > s.lineStart(1) ? 0.4 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const OneTwoThree: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const t = s.words(NUMBERS.slice(0, 3));
  return (
    <Stage>
      <Camera move="drift-right" amount={0.4}>
        <World name={WORLD} />
        {[0, 1, 2].map((i) => (
          <CountThing key={i} i={i} at={t[i] ?? s.lineStart(i)} />
        ))}
        <Character spec={HERO} x={HERO_X} y={ground(HERO_X) + hops(frame, s.fps, t, 35)} look={lookToward(frame, t)} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const FourFive: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const t = s.words(["Four", "five"]);
  const times = [null, null, null, t[0] ?? s.lineStart(0), t[1] ?? s.lineStart(1)];
  return (
    <Stage>
      <Camera move="drift-left" amount={0.4}>
        <World name={WORLD} />
        {times.map((at, i) => (
          <CountThing key={i} i={i} at={at} />
        ))}
        <Character spec={HERO} x={HERO_X} y={ground(HERO_X) + hops(frame, s.fps, t, 35)} look={lookToward(frame, times.map((x) => x ?? 0))} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const AllTogether: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const counted = s.words(["one", "two", "three", "four", "five"]);
  const hooray = s.word("hooray", 0, s.lineStart(2));
  const party = hop(frame, s.fps, hooray, 120, 0.6);
  return (
    <Stage>
      <Camera move="push" focus={[960, 600]} amount={0.7} shakeAt={hooray}>
        <World name={WORLD} />
        {SPOTS.map((_, i) => (
          <CountThing key={i} i={i} at={null} bounceAt={counted[i]} />
        ))}
        <Character
          spec={HERO}
          x={HERO_X}
          y={ground(HERO_X) + hops(frame, s.fps, counted, 30) + party}
          look={interpolate(frame, [counted[0] ?? 0, counted[4] ?? 1], [0.2, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
          flap={frame >= hooray ? 1 : 0}
        />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const Bye: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  return (
    <Stage>
      <Camera move="pull" focus={[HERO_X + 300, ground(HERO_X) - 200]} amount={0.8}>
        <World name={WORLD} />
        {SPOTS.map((_, i) => (
          <CountThing key={i} i={i} at={null} />
        ))}
        <Character spec={HERO} x={HERO_X} y={ground(HERO_X) + hop(frame, s.fps, s.lineStart(1), 50)} scale={1.15} flap={frame > s.lineStart(1) ? 0.6 : 0} />
        <World name={WORLD} layer="front" />
      </Camera>
    </Stage>
  );
};

export const scenes = {
  hello: Hello,
  "one-two-three": OneTwoThree,
  "four-five": FourFive,
  "all-together": AllTogether,
  bye: Bye,
};
