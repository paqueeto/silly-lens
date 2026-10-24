import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Camera,
  Character,
  type CharacterSpec,
  FeltBoard,
  FeltHand,
  FeltNumber,
  HangingStar,
  Hills,
  hop,
  MusicNote,
  Moon,
  mix,
  PawPrint,
  ramp,
  Sky,
  Sparkles,
  Stage,
  Sun,
  Thing,
  type ThingKind,
  usePop,
  useScene,
  walk,
  World,
  WORLDS,
  type WorldName,
} from "../../kit/index.ts";
import { useBeat } from "../../SongFilm.tsx";

// "Los Números": Lupe the bunny counts 1 to 5, and after every verse a new
// friend joins the chorus dance, so the dancers always match the number.

const LUPE: CharacterSpec = { kind: "bunny", scarf: "#f27aa0" };
const BRUNO: CharacterSpec = { kind: "bear", scarf: "#d9534f" };
const OLIVIA: CharacterSpec = { kind: "owl" };
const COCO: CharacterSpec = { kind: "cat" };
const PEPE: CharacterSpec = { kind: "hedgehog", scarf: "#5bb39b" };
const CAST = [LUPE, BRUNO, OLIVIA, COCO, PEPE];

const NUMBERS = [
  { n: 1, word: "uno", gloss: "one", color: "#ff8a5b" },
  { n: 2, word: "dos", gloss: "two", color: "#5bb39b" },
  { n: 3, word: "tres", gloss: "three", color: "#ffc93d" },
  { n: 4, word: "cuatro", gloss: "four", color: "#7f9cf5" },
  { n: 5, word: "cinco", gloss: "five", color: "#e86fb0" },
];

const NUM_X = 330;
const NUM_Y = 430;

/** 1 right at each frame in `at`, easing back to 0 over ~0.25 s. */
function pulse(frame: number, fps: number, at: number[]) {
  let p = 0;
  for (const a of at) {
    const d = (frame - a) / (fps * 0.25);
    if (d >= 0 && d < 1) p = Math.max(p, 1 - d);
  }
  return p;
}

/** The big number for a verse, popping in on its first word and bouncing on every repeat. */
const VerseNumber: React.FC<{ index: number; extra?: string[]; glow?: boolean }> = ({ index, extra = [], glow }) => {
  const s = useScene();
  const frame = useCurrentFrame();
  const num = NUMBERS[index];
  const hits = s.every(num.word, ...extra).map((h) => h.frame);
  const pop = usePop(hits[0] ?? 0, 9);
  return (
    <FeltNumber
      n={num.n}
      x={NUM_X}
      y={NUM_Y}
      size={300}
      color={num.color}
      pop={pop}
      pulse={pulse(frame, s.fps, hits)}
      word={num.word}
      gloss={num.gloss}
      glow={glow}
    />
  );
};

/** Badges 1-2-3 that pop on "uno, dos, tres" in the chorus. */
const CountBadges: React.FC<{ y?: number }> = ({ y = 300 }) => {
  const s = useScene();
  const frame = useCurrentFrame();
  const hits = s.every("uno", "dos", "tres");
  return (
    <>
      {[0, 1, 2].map((i) => {
        const mine = hits.filter((h) => h.word === NUMBERS[i].word).map((h) => h.frame);
        const first = mine[0];
        if (first === undefined || frame < first) return null;
        const p = pulse(frame, s.fps, mine);
        return (
          <FeltNumber key={i} n={i + 1} x={760 + i * 200} y={y} size={170} color={NUMBERS[i].color} pulse={p} pop={Math.min(1, (frame - first) / 4)} />
        );
      })}
    </>
  );
};

const BURST = [
  [-420, -460],
  [-220, -600],
  [0, -640],
  [220, -600],
  [420, -460],
];

/** The chorus: the first k friends dance; each hops on "its" number and everyone on "otra vez" and "contar". */
function makeChorus(k: number, world: WorldName, thing: ThingKind) {
  const Chorus: React.FC = () => {
    const s = useScene();
    const frame = useCurrentFrame();
    const ground = WORLDS[world].groundAt;
    const counts = s.every("uno", "dos", "tres");
    const together = s.every("vez", "contar").map((h) => h.frame);
    const contar = s.every("contar").map((h) => h.frame);
    const burst = usePop(contar[0] ?? s.duration + 100, 10);
    const spacing = k > 3 ? 250 : 280;
    const xs = CAST.slice(0, k).map((_, i) => 960 + (i - (k - 1) / 2) * spacing);
    return (
      <Stage>
        <Camera move="push" focus={[960, 640]} amount={0.5}>
          <World name={world} />
          {BURST.map(([dx, dy], i) => (
            <Thing key={i} kind={thing} x={960 + dx * burst} y={ground(960) + dy * burst} size={40} pop={burst} glow={thing === "star"} />
          ))}
          {CAST.slice(0, k).map((spec, i) => {
            // Dancer i hops on number word i % 3; a number with no dancer of its own makes everyone hop.
            const mine = counts
              .filter((c) => {
                const w = NUMBERS.findIndex((n) => n.word === c.word);
                return w < k ? i % 3 === w : true;
              })
              .map((c) => c.frame + (i >= 3 ? 3 : 0));
            const lift = Math.min(0, ...[...mine, ...together].map((a) => hop(frame, s.fps, a, 70, 0.42)));
            const x = xs[i];
            return (
              <Character
                key={i}
                spec={spec}
                x={x}
                y={ground(x) + lift}
                scale={k > 3 ? 0.85 : 0.95}
                look={(960 - x) / 1200}
                flap={frame >= (contar[0] ?? Infinity) ? 0.9 : 0.25}
                bob={0.8}
              />
            );
          })}
          <CountBadges />
          <World name={world} layer="front" />
        </Camera>
      </Stage>
    );
  };
  return Chorus;
}

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = useBeat();
  const ground = WORLDS["sunny-meadow"].groundAt;
  const title = usePop(beat(0), 11);
  const sub = usePop(beat(4), 11);
  return (
    <Stage>
      <Camera move="push" focus={[960, 500]} amount={0.5}>
        <World name="sunny-meadow" />
        {NUMBERS.map((num, i) => {
          const p = popAt(frame, beat(6 + i));
          return <FeltNumber key={i} n={num.n} x={560 + i * 200} y={490} size={130} color={num.color} pop={p} pulse={pulse(frame, fps, [beat(6 + i)])} />;
        })}
        <FeltNumber n="Los Números" x={960} y={210} size={150} color="#ff8a5b" pop={title} />
        <FeltNumber n="¡Cuenta conmigo!" x={960} y={360} size={80} color="#5bb39b" pop={sub} />
        <Character spec={LUPE} x={960} y={ground(960) + hop(frame, fps, beat(12), 80) + hop(frame, fps, beat(14), 80)} flap={0.45} look={0} />
        <World name="sunny-meadow" layer="front" />
      </Camera>
    </Stage>
  );
};

/** Springy 0 → 1 entrance at frame `at` (a plain function, so it can run in loops). */
function popAt(frame: number, at: number) {
  if (frame < at) return 0;
  const t = frame - at;
  return Math.min(1.12, 1 - Math.exp(-t / 3) * Math.cos(t / 2.2));
}

export const Uno: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const ground = WORLDS["sunny-meadow"].groundAt;
  const dedito = s.word("dedito", 0, s.lineStart(0));
  const raise = ramp(frame, dedito - 4, dedito + 8);
  const handPop = usePop(dedito - 6, 11);
  const waving = frame >= s.lineStart(1) && frame <= s.lineEnd(1) ? 12 * Math.sin((frame / s.fps) * Math.PI * 4) : 0;
  const ti = s.word("ti", 0, s.lineEnd(3));
  const fingerPulse = pulse(frame, s.fps, s.every("dedito").map((h) => h.frame));
  return (
    <Stage>
      <Camera move="push" focus={[900, 600]} amount={0.5}>
        <World name="sunny-meadow" />
        <VerseNumber index={0} extra={["un"]} />
        <FeltHand x={900} y={ground(900) + 30} size={1.05 + 0.08 * fingerPulse} fingers={[raise, 0, 0, 0, 0]} rotate={waving} labels pop={handPop} />
        <Character spec={LUPE} x={1420} y={ground(1420) + hop(frame, s.fps, ti, 90)} look={-0.6} flap={frame >= s.lineStart(1) ? 0.4 : 0} />
        <World name="sunny-meadow" layer="front" />
      </Camera>
    </Stage>
  );
};

export const Dos: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const ground = WORLDS["sunny-meadow"].groundAt;
  const manitas = s.word("manitas", 0, s.lineStart(0));
  const handPop = usePop(manitas - 6, 11);
  const claps = s.every("dos").map((h) => h.frame).filter((f) => f > manitas);
  const clap = pulse(frame, s.fps, claps);
  const aqui = s.word("aqui", 0, s.lineEnd(1));
  return (
    <Stage>
      <Camera move="push" focus={[960, 600]} amount={0.5}>
        <World name="sunny-meadow" />
        <VerseNumber index={1} />
        <FeltHand x={760 + 90 * clap} y={ground(760) + 30} size={0.9} fingers={[1, 1, 1, 1, 1]} rotate={12 - 10 * clap} pop={handPop} />
        <FeltHand x={1120 - 90 * clap} y={ground(1120) + 30} size={0.9} fingers={[1, 1, 1, 1, 1]} rotate={-12 + 10 * clap} flip pop={handPop} />
        {handPop > 0.5
          ? [0, 1].map((i) => (
              <FeltNumber key={i} n={i + 1} x={760 + i * 360} y={420} size={90} color="#ffd65c" pop={Math.min(1, handPop)} />
            ))
          : null}
        <Character spec={LUPE} x={1480} y={ground(1480)} look={-0.6} scale={0.9} />
        <Character spec={BRUNO} x={1720} y={ground(1720) + hop(frame, s.fps, aqui, 60)} look={-0.7} scale={0.9} flap={frame >= aqui ? 0.6 : 0} />
        <World name="sunny-meadow" layer="front" />
      </Camera>
    </Stage>
  );
};

const DAY = { top: "#8fd3f4", bottom: "#fdf1d6", hill: "#79bf6c", far: "#9fd08a" };
const DUSK = { top: "#f08a6c", bottom: "#ffd59a", hill: "#5f8a5a", far: "#7a8f6a" };
const NIGHT = { top: "#12163a", bottom: "#3b3f7c", hill: "#1c3f3c", far: "#262c5e" };

function skyAt(p: number) {
  const a = p < 0.5 ? DAY : DUSK;
  const b = p < 0.5 ? DUSK : NIGHT;
  const k = p < 0.5 ? p * 2 : (p - 0.5) * 2;
  return {
    top: mix(a.top, b.top, k),
    bottom: mix(a.bottom, b.bottom, k),
    hill: mix(a.hill, b.hill, k),
    far: mix(a.far, b.far, k),
  };
}

/** "La, la, la": the day turns into night while Lupe and Bruno sway and notes float up. */
export const Lala: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const p = ramp(frame, 0, s.duration);
  const c = skyAt(p);
  const las = s.every("la").map((h) => h.frame);
  const sway = 6 * Math.sin((frame / s.fps) * Math.PI * 1.6);
  return (
    <Stage>
      <Camera move="still">
        <Sky top={c.top} bottom={c.bottom} />
        <g opacity={p}>
          <Sparkles count={50} seed={7} />
        </g>
        <Sun x={1500} y={200 + 900 * p} r={80} />
        <Moon x={420} y={1100 - 850 * Math.max(0, (p - 0.3) / 0.7)} r={80} />
        <Hills y={760} color={c.far} height={70} seed={2} />
        <Hills y={905} color={c.hill} height={35} seed={4} />
        {las.map((at, i) => {
          const t = (frame - at) / s.fps;
          if (t < 0) return null;
          const x = 820 + (i % 2 ? 260 : 0) + 60 * Math.sin(t * 3 + i);
          return <MusicNote key={i} x={x} y={620 - t * 160} size={1.1} color={NUMBERS[i % 5].color} opacity={Math.max(0, 1 - t / 2.5)} />;
        })}
        <Character spec={LUPE} x={860} y={905} tilt={sway} look={0.3} />
        <Character spec={BRUNO} x={1080} y={905} tilt={-sway} look={-0.3} />
      </Camera>
    </Stage>
  );
};

// Low enough to stay clear of the word tags along the top.
const STARS = [
  { x: 760, len: 430 },
  { x: 1000, len: 370 },
  { x: 1240, len: 430 },
];

export const Tres: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const ground = WORLDS["night-forest"].groundAt;
  const tres = s.every("tres").map((h) => h.frame);
  const fly = s.lineStart(2);
  const land = s.lineEnd(2);
  const ox = walk(frame, 2100, 1200, fly, land);
  const oy = interpolate(frame, [fly, land], [150, ground(1200)], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shine = frame >= s.lineStart(1) ? 0.15 * Math.sin((frame / s.fps) * Math.PI * 3) : 0;
  return (
    <Stage>
      <Camera move="push" focus={[1000, 500]} amount={0.5}>
        <World name="night-forest" />
        <VerseNumber index={2} glow />
        {STARS.map((st, i) => {
          const at = tres[i] ?? s.lineStart(0);
          const drop = ramp(frame, at - 4, at + 10);
          return (
            <g key={i}>
              <HangingStar x={st.x} length={st.len} size={56 * (1 + shine)} drop={drop} lit={drop} seed={i + 3} face />
              {drop > 0.9 ? <FeltNumber n={i + 1} x={st.x} y={st.len + 110} size={70} color="#ffd65c" /> : null}
            </g>
          );
        })}
        <Character spec={LUPE} x={1480} y={ground(1480)} look={-0.5} scale={0.85} />
        <Character spec={BRUNO} x={1700} y={ground(1700)} look={-0.6} scale={0.85} />
        {frame >= fly ? <Character spec={OLIVIA} x={ox} y={oy} scale={0.8} flap={frame < land ? 1 : 0.2} tilt={frame < land ? -8 : 0} look={-0.4} /> : null}
        <World name="night-forest" layer="front" />
      </Camera>
    </Stage>
  );
};

export const Cuatro: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const ground = WORLDS["snowy-hill"].groundAt;
  const cuatros = s.every("cuatro").map((h) => h.frame);
  const walkEnd = s.lineEnd(1);
  const cx = walk(frame, 560, 1260, s.lineStart(0), walkEnd);
  const catXAt = (f: number) => walk(f, 560, 1260, s.lineStart(0), walkEnd);
  const recount = cuatros.slice(4);
  return (
    <Stage>
      <Camera move="push" focus={[960, 640]} amount={0.5}>
        <World name="snowy-hill" />
        <VerseNumber index={3} />
        {cuatros.slice(0, 4).map((at, i) => {
          const px = catXAt(at) - 110;
          const stamp = ramp(frame, at, at + 6);
          const p = pulse(frame, s.fps, recount.filter((_, j) => j % 4 === i));
          return <PawPrint key={i} x={px} y={ground(px) - 12 + (i % 2 ? 14 : -6)} rotate={90} size={0.7 + 0.12 * p} stamp={stamp} label={stamp > 0.9 ? i + 1 : undefined} />;
        })}
        <Character spec={COCO} x={cx} y={ground(cx) - (frame < walkEnd ? 10 * Math.abs(Math.sin((frame / s.fps) * Math.PI * 2.5)) : 0)} look={frame < walkEnd ? 0.8 : -0.3} scale={0.9} />
        <Character spec={LUPE} x={1480} y={ground(1480)} look={-0.6} scale={0.8} />
        <Character spec={BRUNO} x={1650} y={ground(1650)} look={-0.6} scale={0.8} />
        <Character spec={OLIVIA} x={1810} y={ground(1810)} look={-0.7} scale={0.75} />
        <World name="snowy-hill" layer="front" />
      </Camera>
    </Stage>
  );
};

export const Cinco: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const ground = WORLDS["sunny-meadow"].groundAt;
  const cincos = s.every("cinco").map((h) => h.frame);
  const fingers = [0, 1, 2, 3, 4].map((i) => (cincos[i] !== undefined ? ramp(frame, cincos[i] - 3, cincos[i] + 5) : 0));
  const pepeAt = s.lineStart(2);
  const pepe = usePop(pepeAt, 12);
  const waving = frame >= s.lineStart(3) ? 10 * Math.sin((frame / s.fps) * Math.PI * 4) : 0;
  return (
    <Stage>
      <Camera move="push" focus={[960, 600]} amount={0.5}>
        <World name="sunny-meadow" />
        <VerseNumber index={4} />
        <FeltHand x={900} y={ground(900) + 40} size={1.15} fingers={fingers} labels rotate={waving} />
        <Character spec={LUPE} x={1400} y={ground(1400)} look={-0.6} scale={0.75} />
        <Character spec={BRUNO} x={1535} y={ground(1535)} look={-0.6} scale={0.75} />
        <Character spec={OLIVIA} x={1670} y={ground(1670)} look={-0.6} scale={0.7} />
        <Character spec={COCO} x={1800} y={ground(1800)} look={-0.7} scale={0.7} />
        {frame >= pepeAt ? (
          <Character spec={PEPE} x={1260} y={ground(1260) + (1 - pepe) * 200} scale={0.85 * Math.max(0.01, pepe)} look={-0.4} flap={frame >= s.lineStart(3) ? 0.7 : 0} />
        ) : null}
        <World name="sunny-meadow" layer="front" />
      </Camera>
    </Stage>
  );
};

const BOARDS = ["#3f7f6e", "#4a6fa5", "#7a5a9a", "#2f6f8f", "#a5604a", "#3f7f6e"];

export const Repaso: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = useBeat();
  const title = usePop(beat(0), 10);
  return (
    <Stage>
      <FeltBoard color={BOARDS[0]} />
      <FeltNumber n="¡Repasemos!" x={960} y={290} size={150} color="#ffd65c" pop={title} word="Let's review!" />
      {NUMBERS.map((num, i) => {
        const at = beat(4 + i * 2);
        return (
          <FeltNumber key={i} n={num.n} x={480 + i * 240} y={650} size={170} color={num.color} pop={popAt(frame, at)} pulse={pulse(frame, fps, [at, beat(14)])} word={num.word} />
        );
      })}
    </Stage>
  );
};

/** One review card: the number, then its things appear one per beat, counted; then counted again. */
function makeReview(index: number) {
  const Review: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const beat = useBeat();
    const num = NUMBERS[index];
    const n = num.n;
    const appear = Array.from({ length: n }, (_, i) => beat(3 + i));
    const again = Array.from({ length: n }, (_, i) => beat(10 + i));
    const shown = appear.map((a) => popAt(frame, a));
    const bounce = (i: number) => pulse(frame, fps, [again[i]]);
    const objX = (i: number) => 1240 + (i - (n - 1) / 2) * (n > 3 ? 175 : 230);
    let things: React.ReactNode;
    if (n === 1) {
      things = <FeltHand x={1240} y={860} size={1} fingers={[shown[0], 0, 0, 0, 0]} labels pop={popAt(frame, beat(2))} />;
    } else if (n === 2) {
      things = (
        <>
          <FeltHand x={1060} y={860} size={0.85} fingers={[1, 1, 1, 1, 1]} rotate={10} pop={shown[0] * (1 + 0.1 * bounce(0))} />
          <FeltHand x={1420} y={860} size={0.85} fingers={[1, 1, 1, 1, 1]} rotate={-10} flip pop={shown[1] * (1 + 0.1 * bounce(1))} />
        </>
      );
    } else if (n === 5) {
      things = <FeltHand x={1240} y={880} size={1.1} fingers={shown} labels pop={popAt(frame, beat(2))} rotate={4 * Math.sin(frame / 8) * (frame > again[0] ? 1 : 0)} />;
    } else {
      things = appear.map((_, i) =>
        n === 3 ? (
          <Thing key={i} kind="star" x={objX(i)} y={560} size={80} pop={shown[i] * (1 + 0.15 * bounce(i))} glow />
        ) : (
          <PawPrint key={i} x={objX(i)} y={600 + (i % 2 ? 40 : -20)} size={1.1 + 0.15 * bounce(i)} stamp={shown[i]} />
        ),
      );
    }
    const labels =
      n === 3 || n === 4
        ? appear.map((_, i) =>
            shown[i] > 0.8 ? <FeltNumber key={i} n={i + 1} x={objX(i)} y={n === 3 ? 720 : 760} size={70} color="#ffd65c" pulse={bounce(i)} /> : null,
          )
        : null;
    const numPop = popAt(frame, beat(0));
    return (
      <Stage>
        <FeltBoard color={BOARDS[n]} />
        <FeltNumber
          n={n}
          x={470}
          y={450}
          size={320}
          color={num.color}
          pop={numPop}
          pulse={pulse(frame, fps, [beat(0), again[n - 1] + 6])}
          word={num.word}
          gloss={num.gloss}
        />
        {things}
        {labels}
      </Stage>
    );
  };
  return Review;
}

export const Fin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const beat = useBeat();
  const ground = WORLDS["sunny-meadow"].groundAt;
  const title = usePop(beat(0), 10);
  return (
    <Stage>
      <Camera move="pull" focus={[960, 600]} amount={0.6}>
        <World name="sunny-meadow" />
        <FeltNumber n="¡Muy bien!" x={960} y={250} size={170} color="#ff8a5b" pop={title} word="¡Hasta la próxima!" gloss="Great job! See you next time!" />
        {CAST.map((spec, i) => {
          const x = 960 + (i - 2) * 230;
          const lift = Math.min(0, ...[1, 2, 3, 4, 5, 6].map((b) => hop(frame, fps, beat(b) + (i % 2) * 4, 60, 0.4)));
          return <Character key={i} spec={spec} x={x} y={ground(x) + lift} scale={0.85} flap={0.7} look={(960 - x) / 1200} />;
        })}
        <World name="sunny-meadow" layer="front" />
      </Camera>
    </Stage>
  );
};

export const scenes: Record<string, React.FC> = {
  intro: Intro,
  uno: Uno,
  "coro-1": makeChorus(1, "sunny-meadow", "flower"),
  dos: Dos,
  "coro-2": makeChorus(2, "sunny-meadow", "flower"),
  lala: Lala,
  tres: Tres,
  "coro-3": makeChorus(3, "night-forest", "star"),
  cuatro: Cuatro,
  "coro-4": makeChorus(4, "snowy-hill", "snowflake"),
  cinco: Cinco,
  "coro-5": makeChorus(5, "sunny-meadow", "flower"),
  repaso: Repaso,
  "repaso-1": makeReview(0),
  "repaso-2": makeReview(1),
  "repaso-3": makeReview(2),
  "repaso-4": makeReview(3),
  "repaso-5": makeReview(4),
  fin: Fin,
};
