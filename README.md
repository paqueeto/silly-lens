# Paper Cartoons

Felt-and-paper kids' cartoons, made by Claude Code from one idea to a finished MP4.
Scenes are React/SVG rendered by [Remotion](https://www.remotion.dev); the music and
sound effects are synthesised in code; the narrator is ElevenLabs, synced word by word.

Demo story: **Olive and the Lantern Stars** (`src/stories/olive-and-the-lantern-stars`).

## Setup (once)

Needs Node 20+.

```bash
cd paper-cartoons
npm install
```

The first render downloads a headless Chrome (Remotion does this by itself).

Render time is CPU-bound: measured on 4 cores, a 1080p final takes about 11× the
film's length (77 s → 14 min) and a 540p draft about 3×. More cores, faster renders.

## Templates (fastest start)

Three story templates in `templates/` (bedtime, counting, adventure), five worlds
(night forest, night sea, starry sky, sunny meadow, snowy hill) and seven characters.
One command makes a new cartoon that renders straight away:

```bash
npm run new -- pip-and-the-big-snow --template adventure --hero fox --name Pip \
  --friend bunny --friend-name Lulu --world snowy-hill
```

Then rewrite the lines in `src/stories/pip-and-the-big-snow/story.json`. Ready
prompts for Claude are in `PROMPTS.md`.

## Make a cartoon with Claude

Open Claude Code in this folder and say, for example:

> Use the cartoon skill. Make a new kids' cartoon: a little hedgehog who is scared of
> the first snow, and the snowflakes help him. Length about 1 minute. Mood: calm
> bedtime. Age 3 to 5. Start with the story and scene plan, and wait for my OK.

The skill (`.claude/skills/cartoon/`) walks Claude through the story, the scene plan
(which you approve), building the scenes, checking stills, narration, music and the
render.

## Commands

| Command | What it does |
|---|---|
| `npm run new -- <id> --template …` | New story from a template (see above) |
| `npm run studio` | Live editor: scrub every story; compositions `kit` and `worlds` show the building blocks |
| `npm run still -- <id> --scenes` | One JPG per scene in `out/stills/<id>/` |
| `npm run narrate -- <id>` | ElevenLabs narration + word timings (estimate without a key) |
| `npm run music -- <id>` | Soundtrack + sound effects |
| `npm run render -- <id> [--draft]` | `out/<id>.mp4` (draft = 540p, fast) |
| `npm run make -- <id> [--draft]` | narrate → music → render |
| `npm run hour -- <id> <id> … --name x --title "…"` | Joins episodes into one video + a YouTube description with chapters |

## Narration keys

Set these in your shell, never in a committed file:

```bash
export ELEVENLABS_API_KEY=...        # ElevenLabs → Developers → API keys
export ELEVEN_VOICE_ID=...           # from the voice you pick in the Voice Library
# optional
export ELEVEN_MODEL=eleven_v3        # default; supports [softly]-style audio tags
export ELEVEN_STABILITY=0.5
```

Without them everything still works: the film renders silent with subtitles, so you
can review it before paying for a voice.

## Layout

```
templates/        story templates: bedtime, counting, adventure
src/kit/          felt materials, worlds, nature props, characters, moves, camera, overlays
src/stories/<id>/ story.json (script) + scenes.tsx (scenes in code)
src/Film.tsx      title → scenes → end card, word pops, wipes, audio mix
src/timing.ts     narration timeline (shared by scripts and renderer)
scripts/          narrate, music/sfx synth, stills, render, hour
public/<id>/      timing.json, narration lines (keep them: they cost credits), music
```
