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
