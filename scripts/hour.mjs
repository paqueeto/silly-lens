// Join finished stories into one long video, plus a YouTube description with chapters.
//   npm run hour -- <id> <id> <id> … [--name bedtime-hour] [--title "Bedtime Stories for Kids"]
//   npm run hour -- --all
// Renders any story that has no out/<id>.mp4 yet, then joins without re-encoding.
// Chapters go in out/<name>.youtube.txt: paste it into the video description.
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { OUT, listStories, loadStory, seconds } from "./lib.mjs";
import { renderStory } from "./render.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const name = flag("--name") ?? "compilation";
const title = flag("--title") ?? "Bedtime Stories";
const ids = args.includes("--all") ? listStories() : args.filter((a) => !a.startsWith("--"));
if (!ids.length) {
  console.error("Usage: npm run hour -- <id> <id> … [--name file-name] [--title \"Video title\"]  (or --all)");
  process.exit(1);
}

/** Remotion ships ffmpeg/ffprobe, so nothing extra to install. */
const ff = (tool, toolArgs) =>
  execFileSync("npx", ["remotion", tool, ...toolArgs], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const parts = [];
for (const id of ids) {
  const file = path.join(OUT, `${id}.mp4`);
  if (!existsSync(file)) await renderStory(id);
  const duration = Number(ff("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).trim());
  parts.push({ id, title: loadStory(id).title, file, duration });
}

let t = 0;
const chapters = parts.map((p) => {
  const c = { title: p.title, start: t, end: t + p.duration };
  t += p.duration;
  return c;
});

const list = path.join(OUT, `${name}.concat.txt`);
writeFileSync(list, parts.map((p) => `file '${p.file.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
const output = path.join(OUT, `${name}.mp4`);
// YouTube reads chapters from the description (written below), not from the file.
ff("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-metadata", `title=${title}`, "-movflags", "+faststart", output]);

const description = [
  title,
  "",
  "Chapters:",
  ...chapters.map((c) => `${seconds(c.start)} ${c.title}`),
  "",
  "Made with felt-and-paper animation. Narration voiced with AI (ElevenLabs).",
].join("\n");
writeFileSync(path.join(OUT, `${name}.youtube.txt`), description + "\n");

console.log(`\n${output}  (${seconds(t)})\n\n${description}\n`);
if (chapters.length < 3) console.warn("YouTube shows chapters only with 3 or more of them.");
if (chapters.some((c) => c.end - c.start < 10)) console.warn("YouTube needs every chapter to be at least 10 seconds long.");
