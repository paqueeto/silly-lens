import type React from "react";
import type { SceneComponents } from "../Film.tsx";
import type { StorySpec } from "../types.ts";
import oliveSpec from "./olive-and-the-lantern-stars/story.json";
import { scenes as oliveScenes } from "./olive-and-the-lantern-stars/scenes.tsx";
// @new-story-imports (npm run new adds imports above this line)

// Register each story here: its script (story.json) and its scenes (scenes.tsx).
export const STORIES: { spec: StorySpec; scenes: SceneComponents }[] = [
  { spec: oliveSpec as StorySpec, scenes: oliveScenes },
  // @new-story-entries (npm run new adds stories above this line)
];

// Song videos: soundtrack + word-timed lyrics drive the timeline (see SongFilm.tsx).
import type { LineTime, SongSpec } from "../types.ts";
import numerosSpec from "./los-numeros/song.json";
import numerosLyrics from "./los-numeros/lyrics.json";
import { scenes as numerosScenes } from "./los-numeros/scenes.tsx";
import numerosFeltSpec from "./los-numeros-felt/song.json";
import { scenes as numerosFeltScenes } from "./los-numeros-felt/scenes.tsx";
import monsteraSpec from "./monstera/song.json";
import monsteraLyrics from "./monstera/lyrics.json";
import { scenes as monsteraScenes } from "./monstera/scenes.tsx";
import monsteraSketchSpec from "./monstera-sketch/song.json";
import { scenes as monsteraSketchScenes } from "./monstera-sketch/scenes.tsx";

export const SONGS: { spec: SongSpec; lyrics: LineTime[]; scenes: Record<string, React.FC> }[] = [
  { spec: numerosSpec as SongSpec, lyrics: numerosLyrics as LineTime[], scenes: numerosScenes },
  // Same song and lyrics: heavy felt, Tito the monkey, calm scenes, ends with the song.
  { spec: numerosFeltSpec as SongSpec, lyrics: numerosLyrics as LineTime[], scenes: numerosFeltScenes },
  // Stop motion at 12 fps, heavy felt, PG music video.
  { spec: monsteraSpec as SongSpec, lyrics: monsteraLyrics as LineTime[], scenes: monsteraScenes },
  // Same song, sketchbook and crayon: the plant on one page, a person on the other.
  { spec: monsteraSketchSpec as SongSpec, lyrics: monsteraLyrics as LineTime[], scenes: monsteraSketchScenes },
];
