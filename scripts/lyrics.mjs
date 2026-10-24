// Turn a word-timed transcription (scripts/transcribe.py) into lyric lines for a
// song video: src/stories/<id>/lyrics.json.
//   npm run lyrics -- <id> <whisper.json>
// Lines break after the words in BREAK_AFTER (end of a sung phrase). Check the
// output and fix misheard words by hand; timings stay.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./lib.mjs";

const [id, input] = process.argv.slice(2);
if (!id || !input) {
  console.error("Usage: npm run lyrics -- <story-id> <whisper.json>");
  process.exit(1);
}
const BREAK_AFTER = new Set((process.env.BREAK_AFTER ?? "aquí,ti,vez,contar,dedito,manitas,estrellitas,patitas,dedos").split(","));
const clean = (w) => w.toLowerCase().replace(/[¡!¿?.,;:]/g, "");

const words = JSON.parse(readFileSync(input, "utf8")).flatMap((s) => s.words);
const lines = [];
let cur = [];
const flush = () => {
  if (!cur.length) return;
  let text = cur.map((w) => w.w).join(" ").replace(/\s+/g, " ").trim();
  text = text[0].toUpperCase() + text.slice(1);
  lines.push({
    text,
    start: +cur[0].start.toFixed(2),
    end: +cur[cur.length - 1].end.toFixed(2),
    words: cur.map((w) => ({ w: w.w.replace(/[.,;:]+$/, ""), start: +w.start.toFixed(2), end: +w.end.toFixed(2) })),
  });
  cur = [];
};
for (const w of words) {
  // A long pause always starts a new line.
  if (cur.length && w.start - cur[cur.length - 1].end > 0.8) flush();
  cur.push(w);
  const c = clean(w.w);
  const inChorus = cur.some((x) => clean(x.w) === "conmigo");
  if (BREAK_AFTER.has(c) || (c === "tres" && inChorus) || (c === "la" && cur.length >= 5)) flush();
}
flush();
const out = path.join(ROOT, "src/stories", id, "lyrics.json");
writeFileSync(out, JSON.stringify(lines, null, 1) + "\n");
for (const l of lines) console.log(`${l.start.toFixed(2).padStart(7)}  ${l.text}`);
console.log(`\n${lines.length} lines → ${path.relative(ROOT, out)}`);
