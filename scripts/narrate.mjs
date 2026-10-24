// Narration: one ElevenLabs call per line, with word timestamps, then lays the
// whole film out on those real timings (public/<id>/timing.json).
//   ELEVENLABS_API_KEY=… ELEVEN_VOICE_ID=… npm run narrate -- <story-id>
// Lines are cached by text + voice + model, so re-running after editing one
// line only pays for that line. Without a key it writes estimated timing so
// you can still preview and render (silent, with subtitles).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { estimateTiming, layoutTiming, stripTags } from "../src/timing.ts";
import { PUBLIC, loadStory, storyArg } from "./lib.mjs";

const id = storyArg();
const story = loadStory(id);
const storyDir = path.join(PUBLIC, id);
mkdirSync(storyDir, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVEN_VOICE_ID;
const MODEL = process.env.ELEVEN_MODEL ?? "eleven_v3";
// Only for tests against a local stand-in server.
const API = process.env.ELEVEN_API_BASE ?? "https://api.elevenlabs.io";
// Audio tags like [softly] are understood by v3 and later; older models would read them out loud.
const KEEP_TAGS = process.env.ELEVEN_TAGS ? process.env.ELEVEN_TAGS === "1" : /eleven_v([3-9]|\d\d)/.test(MODEL);
const SETTINGS = {
  stability: Number(process.env.ELEVEN_STABILITY ?? 0.5),
  similarity_boost: 0.75,
};

if (!KEY || !VOICE) {
  const timing = estimateTiming(story);
  writeFileSync(path.join(storyDir, "timing.json"), JSON.stringify(timing, null, 2));
  console.log(
    `No ${!KEY ? "ELEVENLABS_API_KEY" : "ELEVEN_VOICE_ID"} set — wrote ESTIMATED timing (${timing.total.toFixed(1)} s).\n` +
      "The film will render silent with subtitles. Set both variables and run this again for the real narrator.",
  );
  process.exit(0);
}

/** Turn ElevenLabs character alignment into words, skipping [audio tags]. */
function wordsFromAlignment(al) {
  const words = [];
  let current = null;
  let inTag = false;
  for (let i = 0; i < al.characters.length; i++) {
    const ch = al.characters[i];
    if (ch === "[") inTag = true;
    const isWordChar = !inTag && /[A-Za-z0-9'’]/.test(ch);
    if (isWordChar) {
      if (!current) current = { w: "", start: al.character_start_times_seconds[i], end: 0 };
      current.w += ch;
      current.end = al.character_end_times_seconds[i];
    } else if (current) {
      words.push(current);
      current = null;
    }
    if (ch === "]") inTag = false;
  }
  if (current) words.push(current);
  return words;
}

async function speak(text) {
  const url = `${API}/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!res.ok) {
    const body = await res.text();
    const hint =
      res.status === 401
        ? "Check ELEVENLABS_API_KEY."
        : res.status === 404
          ? "Check ELEVEN_VOICE_ID (copy it from the voice in your ElevenLabs Voice Library)."
          : res.status === 422 || res.status === 400
            ? `The model "${MODEL}" may not support timestamps or these settings. Try ELEVEN_MODEL=eleven_multilingual_v2.`
            : "";
    throw new Error(`ElevenLabs ${res.status}: ${body.slice(0, 400)}\n${hint}`);
  }
  const json = await res.json();
  const alignment = json.alignment ?? json.normalized_alignment;
  if (!json.audio_base64 || !alignment) throw new Error("ElevenLabs returned no audio or no alignment.");
  return { audio: Buffer.from(json.audio_base64, "base64"), words: wordsFromAlignment(alignment) };
}

const linesDir = path.join(storyDir, "lines");
mkdirSync(linesDir, { recursive: true });
const used = new Set();
const results = [];
let spentChars = 0;

for (const [si, scene] of story.scenes.entries()) {
  results[si] = [];
  for (const [li, raw] of scene.lines.entries()) {
    const text = KEEP_TAGS ? raw.trim() : stripTags(raw);
    const hash = createHash("sha1").update(`${MODEL}|${VOICE}|${JSON.stringify(SETTINGS)}|${text}`).digest("hex").slice(0, 10);
    const base = `${scene.id}-${li + 1}-${hash}`;
    const mp3 = path.join(linesDir, `${base}.mp3`);
    const meta = path.join(linesDir, `${base}.json`);
    used.add(`${base}.mp3`).add(`${base}.json`);
    let words;
    if (existsSync(mp3) && existsSync(meta)) {
      words = JSON.parse(readFileSync(meta, "utf8")).words;
      console.log(`cached  ${scene.id} #${li + 1}`);
    } else {
      let out;
      try {
        out = await speak(text);
      } catch (err) {
        console.error(`\nFailed on ${scene.id} #${li + 1}: ${err.message}`);
        console.error("Lines voiced so far are saved; run again to continue.");
        process.exit(1);
      }
      writeFileSync(mp3, out.audio);
      writeFileSync(meta, JSON.stringify({ text, words: out.words }, null, 2));
      words = out.words;
      spentChars += text.length;
      console.log(`voiced  ${scene.id} #${li + 1}  "${stripTags(text)}"`);
    }
    const end = words.length ? words[words.length - 1].end : 1;
    results[si][li] = { duration: end + 0.15, words, audio: `${id}/lines/${base}.mp3` };
  }
}

const timing = layoutTiming(story, (si, li) => results[si][li], false);
writeFileSync(path.join(storyDir, "timing.json"), JSON.stringify(timing, null, 2));

const stale = readdirSync(linesDir).filter((f) => !used.has(f));
if (process.argv.includes("--clean")) for (const f of stale) rmSync(path.join(linesDir, f));
console.log(
  `\ntiming.json written: ${timing.total.toFixed(1)} s. Characters sent this run: ${spentChars}.` +
    (stale.length && !process.argv.includes("--clean") ? `\n${stale.length} old line files unused (run with --clean to delete).` : ""),
);
