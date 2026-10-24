// Build a song video's soundtrack from the original song (see SongSpec.soundtrack):
// the song up to `cut`, then its instrumental `loop` repeated to fill the film,
// fading out at the end. Writes public/<audio>.
//   npm run soundtrack -- <song-id>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC, ROOT } from "./lib.mjs";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npm run soundtrack -- <song-id>");
  process.exit(1);
}
const spec = JSON.parse(readFileSync(path.join(ROOT, "src/stories", id, "song.json"), "utf8"));
const st = spec.soundtrack;
if (!st) {
  console.error(`${id}/song.json has no "soundtrack" section.`);
  process.exit(1);
}
const SR = 48000;
const input = path.join(PUBLIC, st.song);
const output = path.join(PUBLIC, spec.audio);
const fade = st.fadeOut ?? 3;
const rest = spec.duration - st.cut;
let filter = `[0]atrim=0:${st.cut},asetpts=N/SR/TB[a]`;
if (st.loop && rest > 0) {
  const [a, b] = st.loop;
  const len = b - a;
  const repeats = Math.ceil(rest / len);
  // 6 ms fades at each loop edge prevent clicks at the seams.
  filter +=
    `;[0]atrim=${a}:${b},asetpts=N/SR/TB,aresample=${SR},afade=t=in:d=0.006,afade=t=out:st=${(len - 0.006).toFixed(3)}:d=0.006,` +
    `aloop=loop=${repeats - 1}:size=${Math.round(len * SR)}[l0];` +
    `[l0]atrim=0:${rest},asetpts=N/SR/TB,afade=t=out:st=${(rest - fade).toFixed(3)}:d=${fade}[l];[a]aresample=${SR}[a2];[a2][l]concat=n=2:v=0:a=1[out]`;
} else {
  filter += `;[a]afade=t=out:st=${(st.cut - fade).toFixed(3)}:d=${fade}[out]`;
}
// Needs a full ffmpeg (Remotion's bundled build has no fade filter): brew install ffmpeg.
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("This step needs ffmpeg on your PATH (macOS: brew install ffmpeg).");
  process.exit(1);
}
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", input, "-filter_complex", filter, "-map", "[out]", "-ar", String(SR), "-ac", "2", output], { stdio: "inherit" });
console.log(`${path.relative(ROOT, output)} (${spec.duration} s)`);
