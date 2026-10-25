import React from "react";
import { useCurrentFrame } from "remotion";
import {
  CRAYON_TYPE,
  GRAPHITE,
  Handwriting,
  HAND,
  Line,
  Person,
  ramp,
  ReachingHand,
  rng,
  Scribble,
  SketchDefs,
  SketchLeaf,
  SketchPlant,
  SketchPot,
  SketchSun,
  Sketchbook,
  Tangle,
  useScene,
  type SketchLeafSpec,
} from "../../kit/index.ts";
import { useBeat } from "../../SongFilm.tsx";

// "The Monstera Plant", sketchbook version. The lyrics mean two things at once: a
// plant rescued from the wrong pot, and a person rescued from the wrong place. So the
// book is open on a spread: the plant on the left page, a person on the right,
// living the same lines. Pencil while it's grey, crayon when life comes back, and in
// the second chorus the spine disappears and the two become one drawing.

const LEFT = 480;
const RIGHT = 1440;
const GROUND = 860;
const GREEN = "#3f9a55";
const POT = "#d9774a";
const SHIRT = "#5b8fd6";
const HANDC = "#e0874a";

const LEAVES: SketchLeafSpec[] = [
  { angle: -50, reach: 200, size: 165, seed: 1 },
  { angle: 42, reach: 225, size: 180, seed: 2 },
  { angle: -12, reach: 300, size: 195, seed: 3 },
  { angle: 74, reach: 150, size: 135, seed: 4 },
  { angle: -78, reach: 140, size: 125, seed: 5 },
];

const SMALL = { w: 190, h: 170 };
const BIG = { w: 270, h: 230 };
const potTop = (h: number) => GROUND - h;

/** Frames of beats 0..n-1 from the section start. */
function useBeats(n: number) {
  const beat = useBeat();
  return Array.from({ length: n }, (_, k) => beat(k));
}

/** 0 → 1 between two frames, linear (hand-drawn animation reads best without easing). */
const draw = (frame: number, from: number, frames = 10) => Math.max(0, Math.min(1, (frame - from) / frames));

/** Page with the book, the boiling-line filters and a pencilled ground line on each page. */
const Page: React.FC<{ spread?: boolean; merge?: number; tint?: number; children: React.ReactNode; ground?: boolean }> = ({
  spread = true,
  merge = 0,
  tint = 0,
  children,
  ground = true,
}) => (
  <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
    <SketchDefs />
    <Sketchbook spread={spread} merge={merge} tint={tint > 0 ? GREEN : undefined} tintAt={tint} />
    {ground ? (
      spread && merge < 1 ? (
        <>
          <Line d={`M 120 ${GROUND} Q 480 ${GROUND + 6} 860 ${GROUND - 2}`} width={4} opacity={0.7} />
          <Line d={`M 1060 ${GROUND} Q 1440 ${GROUND + 6} 1800 ${GROUND - 2}`} width={4} opacity={0.7} />
        </>
      ) : (
        <Line d={`M 120 ${GROUND} Q 960 ${GROUND + 10} 1800 ${GROUND - 2}`} width={4} opacity={0.7} />
      )
    ) : null}
    {children}
  </svg>
);

// ---------------------------------------------------------------- intro

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBeats(34);
  return (
    <Page ground={false}>
      <Handwriting text="the monstera plant" x={110} y={330} size={98} progress={draw(frame, b[2], 30)} />
      <Line d="M 110 360 Q 420 378 780 352" width={5} progress={draw(frame, b[10], 8)} />
      <Handwriting text="a song about a plant." x={1060} y={420} size={78} progress={draw(frame, b[13], 18)} />
      <Handwriting text="...or about us." x={1110} y={540} size={78} color="#2f7a45" progress={draw(frame, b[20], 14)} />
      <SketchPot x={LEFT} y={potTop(SMALL.h)} w={SMALL.w} h={SMALL.h} draw={draw(frame, b[26], 12)} />
      <Line d={`M ${RIGHT - 170} ${GROUND} V ${GROUND - 330} H ${RIGHT + 170} V ${GROUND}`} width={5} progress={draw(frame, b[28], 12)} />
    </Page>
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
  const squeeze = b.some((x, k) => k % 2 === 0 && frame >= x && frame < x + 2) ? 1 : 0;
  const wilt = 0.4 + 0.35 * ramp(frame, curl, curl + 8);
  const shake = frame >= fight && frame < fight + 8 ? (frame % 2 ? 7 : -7) : 0;
  const box = 300 - 18 * squeeze;
  return (
    <Page>
      <g transform={`translate(${shake} 0)`}>
        <SketchPlant x={LEFT} y={potTop(SMALL.h)} leaves={LEAVES.slice(0, 4)} grow={[1, 1, 1, 1].map((_, i) => draw(frame, i * 3, 10))} split={0.3} holes={0} wilt={wilt} scale={0.85} />
        <SketchPot x={LEFT} y={potTop(SMALL.h)} w={SMALL.w} h={SMALL.h} squeeze={squeeze} draw={draw(frame, 0, 8)} />
        {frame >= roots ? <Tangle x={LEFT} y={potTop(SMALL.h) + 95} r={58} seed={3} draw={draw(frame, roots, 12)} /> : null}

        {/* the person: curled up in a room too small, turned away from the window */}
        <Line d={`M ${RIGHT - box / 2 - 20} ${GROUND} V ${GROUND - box - 30} H ${RIGHT + box / 2 + 20} V ${GROUND}`} width={5} progress={draw(frame, 0, 8)} />
        <Line d={`M ${RIGHT + 230} ${GROUND - 420} h 150 v 170 h -150 Z M ${RIGHT + 305} ${GROUND - 420} v 170 M ${RIGHT + 230} ${GROUND - 335} h 150`} width={4} progress={draw(frame, 6, 10)} />
        {frame >= light - 2 ? (
          <Line d={`M ${RIGHT + 230} ${GROUND - 330} L ${RIGHT + 60} ${GROUND - 120} M ${RIGHT + 230} ${GROUND - 280} L ${RIGHT + 90} ${GROUND - 60}`} color="#f2c443" width={10} medium="crayon" progress={draw(frame, light - 2, 6)} opacity={0.8} />
        ) : null}
        <Person x={RIGHT - 30} y={GROUND} pose={{ curl: 1 }} scale={0.95} flip draw={draw(frame, 2, 10)} />
        {frame >= roots ? <Tangle x={RIGHT - 30} y={GROUND - 290} r={70} seed={7} draw={draw(frame, roots, 12)} /> : null}
      </g>
    </Page>
  );
};

export const LetYouGo: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const lost = s.word("lost", 0, s.lineStart(0) + 20);
  const nearly = s.word("nearly", 0, s.lineStart(1));
  const go = s.word("go", 0, s.lineEnd(1));
  // Fading away, one step per beat, like an eraser going over the page.
  const steps = b.filter((x) => x >= nearly && frame >= x).length;
  const fade = Math.max(0.22, 1 - steps * 0.07);
  const fall = ramp(frame, lost, lost + 10, (t) => t);
  const handAt = s.duration - 20;
  return (
    <Page>
      <g opacity={fade}>
        <SketchPlant x={LEFT} y={potTop(SMALL.h)} leaves={LEAVES.slice(1, 4)} split={0.3} holes={0} wilt={0.9} scale={0.85} />
        <SketchPot x={LEFT} y={potTop(SMALL.h)} w={SMALL.w} h={SMALL.h} />
        <Tangle x={LEFT} y={potTop(SMALL.h) + 95} r={58} seed={3} />
        <Line d={`M ${RIGHT - 170} ${GROUND} V ${GROUND - 330} H ${RIGHT + 170} V ${GROUND}`} width={5} />
        <Person x={RIGHT - 30} y={GROUND} pose={{ curl: 1 }} scale={0.95} flip />
        <Tangle x={RIGHT - 30} y={GROUND - 290} r={70} seed={7} />
      </g>
      {frame >= lost ? (
        <SketchLeaf x={LEFT - 160 - 40 * fall} y={GROUND - 330 + 300 * fall} size={120} angle={-60 + 150 * fall} split={0.3} holes={0} wilt={0.8} seed={1} />
      ) : null}
      {frame >= go ? <Handwriting text="almost..." x={150} y={200} size={70} progress={draw(frame, go, 10)} color="#8a8b90" /> : null}
      <ReachingHand x={LEFT + 300} y={GROUND - 640} tx={LEFT + 80} ty={GROUND - 330} color={HANDC} draw={draw(frame, handAt, 10)} />
      <ReachingHand x={RIGHT + 340} y={GROUND - 620} tx={RIGHT + 70} ty={GROUND - 300} color={HANDC} draw={draw(frame, handAt + 3, 10)} />
    </Page>
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
  const grow = LEAVES.map((_, i) => draw(frame, b[i * 2] ?? 0, 6));
  const opened = draw(frame, survivor, 4);
  // From the wrong soil to the right hands: the plant goes from the small pot to a big one.
  const moved = frame >= hands;
  const lift = moved ? 0 : ramp(frame, wrong, wrong + 6) * 120;
  const pot = moved ? BIG : SMALL;
  // The person: stands up taking the hand, climbs three steps, then dances.
  const climbSteps = b.filter((x) => x >= climber && frame >= x).slice(0, 3).length;
  const dancing = frame >= thriving;
  const swing = dancing ? (b.filter((x) => frame >= x).length % 2 ? 1 : -1) : 0;
  const px = RIGHT - 120 + climbSteps * 70;
  const py = GROUND - climbSteps * 50;
  return (
    <Page>
      <SketchSun x={960} y={150} r={70} draw={draw(frame, thriving, 8)} />
      <Handwriting text="survivor" x={130} y={180} size={90} color="#2f7a45" progress={draw(frame, survivor, 8)} />
      <Handwriting text="climber" x={1230} y={180} size={90} color="#2f6aa6" progress={draw(frame, climber, 8)} />

      {frame >= climber ? <Line d={`M ${LEFT + 60} ${potTop(pot.h) + 10} Q ${LEFT + 70} ${potTop(pot.h) - 260} ${LEFT + 55} ${potTop(pot.h) - 470}`} color="#8a5a36" width={12} medium="crayon" progress={draw(frame, climber, 6)} /> : null}
      <g transform={`translate(0 ${-lift})`}>
        <SketchPlant x={LEFT} y={potTop(pot.h)} leaves={LEAVES} grow={grow} color={GREEN} fill={1} split={opened} holes={opened} scale={moved ? 0.95 : 0.85} />
      </g>
      <SketchPot x={LEFT} y={potTop(pot.h)} w={pot.w} h={pot.h} color={POT} fill={1} draw={moved ? draw(frame, hands, 6) : 1} />
      {frame >= wrong && frame < hands + 8 ? (
        <>
          <ReachingHand x={LEFT - 380} y={GROUND - 260} tx={LEFT - 110} ty={potTop(pot.h) - 30 - lift} color={HANDC} />
          <ReachingHand x={LEFT + 380} y={GROUND - 260} tx={LEFT + 110} ty={potTop(pot.h) - 30 - lift} color={HANDC} />
        </>
      ) : null}

      {/* the person takes the hand, stands, climbs, dances */}
      {frame >= climber ? (
        <Line
          d={`M ${RIGHT - 160} ${GROUND} h 70 v -50 h 70 v -50 h 70 v -50 h 120`}
          color="#7a6a5a"
          width={6}
          medium="crayon"
          progress={draw(frame, climber, 6)}
        />
      ) : null}
      <ReachingHand x={px + 380} y={py - 640} tx={px + 70} ty={py - 410} color={HANDC} draw={frame < thriving ? 1 : 0} />
      <Person x={px} y={py} pose={{ reach: dancing ? 0 : 1, swing, mood: 1 }} shirt={SHIRT} fill={draw(frame, 0, 10)} />
      {frame >= hands ? <ReachingHand x={px + 360} y={py - 120} tx={px + 60} ty={py - 160} color="#c9608a" draw={draw(frame, hands, 6) * (dancing ? 0 : 1)} /> : null}
    </Page>
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
  const crown = s.word("crown", 0, s.lineEnd(2));
  const clods = b.filter((x) => x >= tore).slice(0, 5);
  const r = rng(9);
  const pieces = clods.map((at) => ({ at, dx: (r() - 0.5) * 200, dy: r() * 40 }));
  const lowered = frame >= space;
  const plantY = potTop(BIG.h) - (lowered ? 0 : 150);
  const stretchK = ramp(frame, stretch, stretch + 10);
  // Rain over the person until there's space; then it stops.
  const raining = frame < space;
  const boxFade = 1 - ramp(frame, space, space + 8);
  const rr = rng(4);
  const rain = Array.from({ length: 14 }, () => ({ x: RIGHT - 220 + rr() * 440, y: rr() * 300 }));
  return (
    <Page>
      {/* the plant: dirt shaken off, set in a big pot, watered, standing tall */}
      <SketchPlant x={LEFT} y={plantY} leaves={LEAVES} color={GREEN} fill={1} scale={0.9 * (1 + 0.12 * stretchK)} />
      {!lowered ? <Scribble shape={`M ${LEFT - 80} ${plantY} a 80 60 0 1 0 160 0 a 80 60 0 1 0 -160 0`} box={[LEFT - 80, plantY - 60, 160, 120]} color="#6b4a33" spacing={9} /> : null}
      {pieces.map((p, i) => {
        if (frame < p.at) return null;
        // Each clod drops off the roots and lands on the table.
        const y = Math.min(GROUND - 12, plantY + 60 + p.dy + (frame - p.at) * 35);
        const x = LEFT + p.dx;
        return <Scribble key={i} shape={`M ${x - 16} ${y} a 16 12 0 1 0 32 0 a 16 12 0 1 0 -32 0`} box={[x - 16, y - 12, 32, 24]} color="#6b4a33" spacing={7} />;
      })}
      <SketchPot x={LEFT} y={potTop(BIG.h)} w={BIG.w} h={BIG.h} color={POT} fill={1} />
      {b
        .filter((x) => x >= drown - 2)
        .slice(0, 3)
        .map((at, i) =>
          frame >= at && frame < at + 7 ? (
            <Line key={i} d={`M ${LEFT - 40 + i * 40} ${120 + (frame - at) * 90} q 8 18 0 30 q -8 -12 0 -30`} color="#4aa3d6" width={9} medium="crayon" />
          ) : null,
        )}

      {/* the person: the weight falls off, the walls come down, the rain stops, a leafy crown */}
      <g opacity={boxFade}>
        <Line d={`M ${RIGHT - 170} ${GROUND} V ${GROUND - 330} H ${RIGHT + 170} V ${GROUND}`} width={5} />
      </g>
      {raining
        ? rain.map((d, i) => <Line key={i} d={`M ${d.x} ${60 + ((d.y + frame * 40) % 320)} l -8 26`} color="#6f8fb0" width={4} />)
        : null}
      {frame < tore ? <Scribble shape={`M ${RIGHT - 70} ${GROUND - 330} h 140 v 70 h -140 Z`} box={[RIGHT - 70, GROUND - 330, 140, 70]} color="#3d3e44" spacing={8} /> : null}
      {frame >= tore
        ? [0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${(i - 1) * 60} ${Math.min(GROUND - 270, (frame - tore) * 40)})`}>
              <Scribble shape={`M ${RIGHT - 20} ${GROUND - 320} h 40 v 30 h -40 Z`} box={[RIGHT - 20, GROUND - 320, 40, 30]} color="#3d3e44" spacing={7} />
            </g>
          ))
        : null}
      <Person x={RIGHT} y={GROUND} pose={{ stretch: stretchK, mood: lowered ? 1 : 0 }} shirt={SHIRT} fill={1} crown={draw(frame, crown - 2, 8)} />
    </Page>
  );
};

// ---------------------------------------------------------------- chorus 2

const WORDS = [
  { word: "survivor", text: "SURVIVOR", color: "#2f7a45" },
  { word: "climber", text: "CLIMBER", color: "#2f6aa6" },
  { word: "hands", text: "RIGHT HANDS", color: "#c9608a" },
  { word: "thriving", text: "THRIVING", color: "#d98c1f" },
];

/** Crayon leaves that appear in the margins, one per beat: six slots each side, never piling up. */
const GARDEN = (() => {
  const r = rng(77);
  const slots: [number, number][] = [];
  for (const [x0, x1] of [[150, 380], [1540, 1770]]) for (const y of [300, 520, 740]) slots.push([x0, y], [x1, y + 90]);
  return slots.map(([x, y], i) => ({
    x: x + (r() - 0.5) * 30,
    y: y + (r() - 0.5) * 30,
    size: 95 + r() * 35,
    angle: (x < 960 ? -1 : 1) * (25 + r() * 45),
    color: ["#3f9a55", "#5bb36a", "#2f7a45", "#7cc46b"][i % 4],
    seed: 100 + i,
  }));
})();

export const ChorusTwo: React.FC = () => {
  const s = useScene();
  const frame = useCurrentFrame();
  const b = useBeats(48);
  const beatNo = b.filter((x) => frame >= x).length;
  const merge = ramp(frame, 0, b[4] ?? 12);
  const times = WORDS.map((w) => s.word(w.word, 0, -1));
  let current = -1;
  times.forEach((t, i) => {
    if (t >= 0 && frame >= t) current = i;
  });
  const swing = beatNo % 2 ? 1 : -1;
  const sway = beatNo % 2 ? 4 : -4;
  return (
    <Page spread merge={merge}>
      {GARDEN.slice(0, Math.max(0, beatNo - 2)).map((l, i) => (
        <SketchLeaf key={i} x={l.x} y={l.y + l.size} size={l.size} angle={l.angle} color={l.color} fill={1} seed={l.seed} />
      ))}
      <SketchSun x={1700} y={150} r={56} />
      {current >= 0 ? (
        <g key={current}>
          <Handwriting
            text={WORDS[current].text}
            x={960}
            y={140}
            size={WORDS[current].text.length > 8 ? 90 : 104}
            color={WORDS[current].color}
            font={CRAYON_TYPE}
            weight={400}
            anchor="middle"
            progress={draw(frame, times[current], 6)}
          />
        </g>
      ) : null}
      <SketchPlant x={820} y={potTop(BIG.h)} leaves={LEAVES} color={GREEN} fill={1} scale={0.88} sway={sway} />
      <SketchPot x={820} y={potTop(BIG.h)} w={BIG.w} h={BIG.h} color={POT} fill={1} />
      <Person x={1230} y={GROUND} pose={{ swing, mood: 1 }} shirt={SHIRT} fill={1} crown={1} />
    </Page>
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
  // We grow in fits: the sprout jumps on every fourth beat and holds still between.
  const jumps = b.filter((x, k) => k % 4 === 0 && frame >= x && x >= fits - 30).length;
  const height = Math.min(0.8, 0.2 + jumps * 0.12);
  const apart = frame >= broken && frame < wits ? ramp(frame, broken + 6, broken + 12) * 24 : 0;
  const greenK = ramp(frame, green, green + 10);
  const soil = potTop(SMALL.h);
  const leafColor = greenK > 0 ? GREEN : null;
  return (
    <Page spread={false} tint={greenK}>
      <Line d={`M 960 ${soil} Q 985 ${soil - 200 * height} 950 ${soil - 400 * height}`} color={leafColor ?? GRAPHITE} width={8} medium={leafColor ? "crayon" : "pencil"} />
      <SketchLeaf x={950} y={soil - 400 * height} size={110 + 140 * height} angle={-6} split={0.3 + 0.7 * height} holes={height} color={leafColor} fill={greenK} seed={91} />
      <SketchPot x={960} y={soil} w={SMALL.w} h={SMALL.h} crack={draw(frame, broken, 6)} gold={draw(frame, wits, 10)} apart={apart} color={greenK > 0 ? POT : null} fill={greenK} />
      <Person x={1300} y={GROUND} pose={{ mood: greenK > 0 ? 1 : 0 }} shirt={greenK > 0 ? SHIRT : null} fill={greenK} />
      <Handwriting text="in broken pots..." x={140} y={200} size={72} progress={draw(frame, broken, 10)} color="#7d7e84" />
      <Handwriting text="...we find our wits" x={150} y={290} size={72} progress={draw(frame, wits, 10)} color="#b8860b" />
    </Page>
  );
};

// ---------------------------------------------------------------- outro

/** Flip-book: every two beats a new page, the person dancing, the leaves taking over. */
export const Flipbook: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBeats(40);
  const beatNo = b.filter((x) => frame >= x).length;
  const page = Math.floor(beatNo / 2);
  const flipping = b.some((x, k) => k % 2 === 0 && frame >= x && frame < x + 1);
  const r = rng(page * 13 + 5);
  const leaves = GARDEN.slice(0, Math.min(GARDEN.length, 4 + page));
  const poses = [{ swing: 1 }, { stretch: 1 }, { swing: -1 }, { reach: 1 }];
  return (
    <Page spread={false}>
      {leaves.map((l, i) => (
        <SketchLeaf key={i} x={l.x + (r() - 0.5) * 20} y={l.y + l.size} size={l.size} angle={l.angle + (r() - 0.5) * 16} color={l.color} fill={1} seed={l.seed} />
      ))}
      <SketchSun x={1000} y={130} r={56} />
      <SketchPlant x={800} y={potTop(BIG.h)} leaves={LEAVES} color={GREEN} fill={1} scale={0.9} sway={page % 2 ? 6 : -6} />
      <SketchPot x={800} y={potTop(BIG.h)} w={BIG.w} h={BIG.h} color={POT} fill={1} />
      <Person x={1190} y={GROUND} pose={{ ...poses[page % poses.length], mood: 1 }} shirt={SHIRT} fill={1} crown={1} />
      {flipping ? <rect x={0} y={0} width={1920} height={1080} fill="#efe7d6" opacity={0.55} /> : null}
      <text x={1840} y={1010} textAnchor="end" fontFamily={HAND} fontWeight={700} fontSize={40} fill="#8a8b90">
        {page + 1}
      </text>
    </Page>
  );
};

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Page spread={false}>
      <SketchSun x={1650} y={170} r={62} />
      <Handwriting text="the monstera plant" x={130} y={330} size={112} progress={draw(frame, 0, 14)} />
      <Line d="M 130 365 Q 480 382 880 355" width={5} progress={draw(frame, 10, 8)} />
      <Handwriting text="(still growing)" x={170} y={470} size={70} color="#2f7a45" progress={draw(frame, 16, 10)} />
      <SketchPlant x={1280} y={potTop(BIG.h)} leaves={LEAVES} color={GREEN} fill={1} scale={0.92} />
      <SketchPot x={1280} y={potTop(BIG.h)} w={BIG.w} h={BIG.h} color={POT} fill={1} />
      <Person x={1660} y={GROUND} pose={{ mood: 1 }} shirt={SHIRT} fill={1} crown={1} />
    </Page>
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
  flipbook: Flipbook,
  title: Title,
};
