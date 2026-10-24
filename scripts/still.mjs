// Render single frames to check a scene without rendering the film.
//   npm run still -- <story-id> [seconds ...]       e.g. npm run still -- olive-and-the-lantern-stars 6 12.5
//   npm run still -- <story-id> --scenes            one frame from the middle of every scene
import { mkdirSync } from "node:fs";
import path from "node:path";
import { renderStill } from "@remotion/renderer";
import { OUT, browserExecutable, getComposition, storyArg } from "./lib.mjs";

const id = storyArg();
const args = process.argv.slice(3);
const { serveUrl, composition } = await getComposition(id);
const fps = composition.fps;
const timing = composition.props.timing;

let shots = [];
if (args.includes("--scenes") && timing) {
  shots = [
    { name: "title", t: timing.title.end * 0.7 },
    ...timing.scenes.map((s) => ({ name: s.id, t: (s.start + s.end) / 2 })),
    { name: "end", t: timing.outro.start + 2.5 },
  ];
} else {
  const times = args.length ? args.map(Number) : [composition.durationInFrames / fps / 2];
  shots = times.map((t) => ({ name: `t${t}`, t }));
}

const dir = path.join(OUT, "stills", id);
mkdirSync(dir, { recursive: true });
for (const shot of shots) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(shot.t * fps));
  const output = path.join(dir, `${shot.name}.jpg`);
  const started = Date.now();
  await renderStill({
    serveUrl,
    composition,
    frame,
    output,
    imageFormat: "jpeg",
    jpegQuality: 88,
    browserExecutable: browserExecutable(),
  });
  console.log(`${output}  (frame ${frame}, ${Date.now() - started} ms)`);
}
