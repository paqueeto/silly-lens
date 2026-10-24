// Idea-to-MP4 in one command, once story.json and scenes.tsx exist:
//   npm run make -- <story-id> [--draft]
// narrate (or estimate) → music + sound effects → render.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { ROOT, storyArg } from "./lib.mjs";
import { renderStory } from "./render.mjs";

const id = storyArg();
const run = (script) => execFileSync(process.execPath, [path.join(ROOT, "scripts", script), id], { stdio: "inherit" });
run("narrate.mjs");
run("music.mjs");
await renderStory(id, { draft: process.argv.includes("--draft") });
