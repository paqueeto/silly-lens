# Felt & paper kit

Import everything from `src/kit/index.ts`. The stage is 1920 × 1080; y grows down.
Pieces animate themselves from the frame (drifting clouds, rolling waves, swaying
stars, blinking eyes), so a scene mostly places things.

## Stage and timing (`kit/scene.tsx`)

| Piece | Use |
|---|---|
| `<Stage>` | Full-frame SVG for a scene. Exactly one per scene. |
| `<Camera move focus amount shakeAt>` | `still`, `push`, `pull`, `drift-left`, `drift-right`, `rise`, `sink`. `focus=[x,y]` for push/pull. `shakeAt` = frame of a big moment. |
| `useScene()` | `word("stars", n?)` frame a word is spoken · `words([...])` · `lineStart(i)` / `lineEnd(i)` · `duration` · `fps` · `seconds(s)`. |
| `usePop(frame)` | 0→1 spring starting at a frame (entrances). |
| `ramp(frame, from, to)` | Smooth 0→1 between two frames. |
| `wobble(frame, fps, period, phase)` | −1…1 idle motion. |

## Materials (`kit/felt.tsx`)

| Piece | Use |
|---|---|
| `<Felt>` | Group with fuzzy felt edges, fibre texture and a cut-out shadow. Put custom shapes inside. `flat` for no shadow. |
| `<Stitch d color>` | Dashed running stitch along a path. Add one just inside each new shape. |
| `<FeltEllipse cx cy rx ry fill>` | Felt ellipse/circle with automatic inset stitch. |
| `filter="url(#paper)"` | Paper grain (skies, cards). `url(#glow)` for light sources. |
| `mix`, `lighter`, `darker` | Colour helpers. Stitches are usually `lighter(fill, 0.4)`. |
| `smoothPath(points)`, `starPath`, `ellipsePath` | Path builders. |
| `rng(seed)` | Deterministic randomness. Never use `Math.random()`. |

Put `<Felt>` **inside** any moving transform, so the texture travels with the
object.

## Nature and props (`kit/nature.tsx`)

| Piece | Notes |
|---|---|
| `<Sky top bottom>` | Gradient paper sky. Night: `#12163a → #3b3f7c`. Day: `#8fd3f4 → #fdf1d6`. |
| `<Sparkles count seed area>` | Twinkling little stars. |
| `<Moon x y r>` | Felt moon with soft halo. |
| `<HangingStar x length size drop lit face seed>` | Star on a thread from the top. `drop` 0→1 lowers it, `lit` 0→1 glows, `face` adds a smile. |
| `<Cloud x y w color speed seed>` | Drifts and wraps around. Night `#5a5f9e`, day `#ffffff`. |
| `<WaveBand y color amp length speed phase>` | Stack 3–4 from back (dark) to front (light), alternating speed sign. |
| `<Hills y color height seed>` | Rolling stitched horizon. |
| `<RoundTree>`, `<PineTree>` | (x, y) = trunk base. |
| `<OakTree x ground scale branchTo>` | Big tree with hollow at `(x+5s, ground−300s)` and a branch whose top is at `ground − 470·scale`. |
| `<Branch from to thickness leaves>` + `branchTopY(from, to, x)` | Perch. Put a character at `y = branchTopY(...) + 4`. |
| `<Lighthouse x y scale beam>`, `<Island>`, `<Boat>` | Sea props. Boat bobs by itself. |
| `<Fireflies count seed area>` | Glowing drifting dots. |

## Characters (`kit/critters.tsx`)

Origin (0, 0) is between the feet; about 230 px tall at scale 1.

- `<Owl color belly face …pose>`
- `<Critter kind="mouse|bunny|bear|fox|cat|hedgehog" color belly scarf …pose>`

Pose props: `x y scale flip look(−1…1) sleepy(0…1) flap(0…1) bob(0…1) tilt(deg)`.
Eyes blink on their own. Flying: `flap={1} tilt={8}` and move x/y along a path with
`ramp`. Fall asleep: ramp `sleepy` to ~0.95.

Pick a palette per character once (`const OLIVE = {...}`) and spread it in every
scene.

## Film layer (automatic, `kit/overlays.tsx`)

The film adds these for you: title card, `pop` words (felt tags, top centre),
torn-paper wipes between scenes, subtitles while there is no narration, the end card,
music with ducking, `sfx` cues, and a whoosh on every wipe.
