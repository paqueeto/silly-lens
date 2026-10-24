---
name: cartoon
description: Make felt-and-paper kids' cartoons in this project, from one idea to a finished MP4 — story, scene plan, scenes built in code with the felt kit, ElevenLabs narration synced to the words, music written in code, render, and hour-long compilations with YouTube chapters. Use when asked to make, change or extend a kids' cartoon, bedtime story video, or a compilation.
---

# Cartoon: idea → MP4

Everything is code: Remotion renders React/SVG scenes, a synth in `scripts/` writes
the music, ElevenLabs reads the story. No video generators, no credits beyond the
narrator.

Read `kit.md` (next to this file) before building scenes. Read `youtube.md` before
anything goes on YouTube.

## 0. Brief

Need: **idea**, **length**, **mood** (`bedtime` or `playful`), **age**. Defaults if
not given: about 1 minute, bedtime, ages 3–5. Ask only if the idea itself is missing.

## 1. Story and scene plan — then STOP for approval

Write it in chat, not in files yet:

- **Title** and one-line premise.
- **Characters**: name, animal (`Owl` or a `Critter` kind), and fixed colours. One look
  per character, reused in every scene.
- **Scene table**: `id` (kebab-case) · setting and what we see · camera move · the
  narration lines · `pop` words · sound effects.

Writing rules for little kids:

- Short sentences, mostly under 12 words. One idea per line.
- A small, gentle problem solved by kindness, courage or friendship. No villains,
  no real peril at bedtime.
- Repetition, counting ("One little star. Two little stars…") and a refrain kids can
  say along. End calm and resolved; bedtime stories end with goodnight.
- 1 to 3 `pop` words per scene: names, numbers, feeling words, the big moment.

Length math: narration runs about 140 words a minute, each scene adds about 2.3 s of
breathing room, plus 4 s title and 5 s end card. One minute ≈ 90–110 words over 5–7
scenes. Ten minutes is a series of ~8 such stories, not one long story (see §7).

**Wait for the user's OK before creating any files.**

## 2. Create the files

1. `src/stories/<id>/story.json` — follow `StorySpec` in `src/types.ts`. Narration
   lines may carry ElevenLabs v3 audio tags such as `[softly]`, `[whispers]`,
   `[warmly]`, `[giggles]`; they are stripped for subtitles and timing.
2. `src/stories/<id>/scenes.tsx` — one component per scene id, exported as
   `export const scenes = { "scene-id": Component, … }`. Copy the structure of
   `src/stories/olive-and-the-lantern-stars/scenes.tsx`.
3. Register both in `src/stories/index.ts`.

A scene with no component renders a placeholder card showing its lines, so you can
build scene by scene.

## 3. Build each scene in code

Rules that keep the films good and the renders identical every time:

- One `<Stage>`, then `<Camera move=…>`, then layers **back to front**: sky →
  sparkles/moon → far clouds → hills/sea → props → characters.
- **Act on the voice.** Anything that happens "when the narrator says X" uses
  `useScene().word("x")` (frame when the word starts) — never hard-coded seconds.
  `s.words([...])` for a list, `s.lineStart(i)` / `s.lineEnd(i)` for lines,
  `s.duration` for the scene length. Timings change when real narration arrives, and
  this keeps every beat locked to it.
- Animate only from `useCurrentFrame()` with `ramp`, `usePop`, `wobble`,
  `interpolate`. No `Math.random()`, no CSS animations, no timers: use `rng(seed)`.
- Reuse kit pieces before drawing new ones. New shapes go inside `<Felt>` and get a
  `<Stitch>`, so they match. Add genuinely reusable pieces to `src/kit/`.
- Keep faces clear of the top ~260 px band in the middle: that is where `pop`
  words land.

## 4. Look at it

```bash
npm run still -- <id> --scenes      # one JPG per scene + title + end in out/stills/<id>/
npm run still -- <id> 12.5 30       # specific seconds
```

Open the JPGs and check: characters readable and not cropped, nothing important
under the pop words or subtitles, colours consistent, no empty corners. Fix and
re-check. `npm run studio` opens the live editor (composition `kit` shows every kit
piece).

## 5. Narrator (ElevenLabs)

Needs `ELEVENLABS_API_KEY` and `ELEVEN_VOICE_ID` in the environment (never in a
committed file). Optional: `ELEVEN_MODEL` (default `eleven_v3`), `ELEVEN_STABILITY`
(default 0.5).

```bash
npm run narrate -- <id>
```

One request per line, with word timestamps; lines are cached by text + voice + model,
so editing one line only re-buys that line. It writes `public/<id>/timing.json`, which
every scene's `word()` timing reads. Without a key it writes an estimate and the film
renders silent with subtitles. See `voices.md` for picking the voice and using tags.

After narrating, re-run `npm run still -- <id> --scenes`: scene lengths move.

## 6. Music, sound, render

```bash
npm run music -- <id>                 # music.wav + shared sfx; tune = story.json "music": {seed, bpm}
npm run render -- <id> --draft        # 540p quick check
npm run render -- <id>                # 1080p final → out/<id>.mp4
npm run make -- <id>                  # narrate → music → render in one go
```

Sound effects available for `sfx` cues: `twinkle`, `whoosh`, `pop`, `hoot`, `flap`,
`waves` (loop), `crickets` (loop). Add new ones in `scripts/music.mjs` → `sfx()`.
Music ducks under the narrator automatically. Different seed = different tune.

Measured render speed on a 4-core machine: 1080p final ≈ 11× the film's length
(a 77 s film took 14 min), 540p draft ≈ 3×. It scales roughly with CPU cores, so a
modern 8–12 core laptop should be several times faster (not measured). An hour of
film is an overnight render: render episodes as they are approved, not all at the
end. Always draft first.

## 7. A full hour

Build a **series**: same world, same main characters, a new small adventure each
episode (5–8 minutes of story each, or many 1–2 minute stories). Keep a series bible
(`src/stories/SERIES.md`: characters with colours, places, refrain, rules) so every
episode matches.

```bash
npm run hour -- <id> <id> <id> --name bedtime-hour-1 --title "Bedtime Stories with Olive"
```

Renders anything missing, joins without re-encoding, embeds chapters, and writes
`out/<name>.youtube.txt` with the chapter list for the description.

## 8. Changes

"Make the owl pink", "slow down scene 3", "add a frog" → edit `story.json` or the
scene component, `npm run still` to check, then re-render. Changing a narration line
means `npm run narrate` again (only that line is re-voiced).
