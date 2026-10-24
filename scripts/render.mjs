// Render a story to out/<id>.mp4.
//   npm run render -- <story-id>            1080p final
//   npm run render -- <story-id> --draft    540p quick check
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderMedia } from "@remotion/renderer";
import { OUT, browserExecutable, getComposition, seconds, storyArg } from "./lib.mjs";

export async function renderStory(id, { draft = false } = {}) {
  const { serveUrl, composition } = await getComposition(id);
  const { timing, hasMusic, hasSfx } = composition.props;
  if (!hasMusic || !hasSfx) console.warn("No music or sound effects yet — run `npm run music -- " + id + "` first.");
  if (timing?.estimated) console.warn("No narration yet (estimated timing): rendering silent with subtitles.");

  mkdirSync(OUT, { recursive: true });
  const output = path.join(OUT, draft ? `${id}.draft.mp4` : `${id}.mp4`);
  const raw = output.replace(/\.mp4$/, ".raw.mp4");
  const length = composition.durationInFrames / composition.fps;
  console.log(`Rendering ${id}: ${seconds(length)} (${composition.durationInFrames} frames)${draft ? " [draft]" : ""}`);
  const started = Date.now();
  let lastShown = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: raw,
    // Felt grain is expensive to encode; 20 stays clean after YouTube's re-encode.
    crf: draft ? 28 : 20,
    x264Preset: draft ? "veryfast" : "medium",
    colorSpace: "bt709",
    pixelFormat: "yuv420p",
    imageFormat: "jpeg",
    jpegQuality: draft ? 80 : 92,
    scale: draft ? 0.5 : 1,
    audioCodec: "aac",
    enforceAudioTrack: true,
    audioBitrate: "192k",
    concurrency: Math.max(1, os.cpus().length - 1),
    browserExecutable: browserExecutable(),
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 20) * 5;
      if (pct !== lastShown) {
        lastShown = pct;
        const elapsed = (Date.now() - started) / 1000;
        const eta = progress > 0.02 ? elapsed / progress - elapsed : NaN;
        console.log(`  ${String(pct).padStart(3)}%  ${seconds(elapsed)} elapsed${Number.isFinite(eta) ? `, ~${seconds(eta)} left` : ""}`);
      }
    },
  });
  // Even loudness for every episode (-16 LUFS, a calm level that YouTube won't need to boost).
  execFileSync(
    "npx",
    ["remotion", "ffmpeg", "-y", "-v", "error", "-i", raw, "-c:v", "copy", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", output],
    { stdio: "inherit" },
  );
  rmSync(raw);
  const took = (Date.now() - started) / 1000;
  console.log(`Done: ${output} in ${seconds(took)} (${(took / length).toFixed(1)}× the film's length)`);
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await renderStory(storyArg(), { draft: process.argv.includes("--draft") });
}
