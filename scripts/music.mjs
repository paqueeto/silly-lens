// Writes the soundtrack for a story (public/<id>/music.wav) and the shared
// sound effects (public/sfx/*.wav). Free, offline, deterministic: same story
// + same seed = same music.
//   npm run music -- <story-id>
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { estimateTiming } from "../src/timing.ts";
import { PUBLIC, loadStory, storyArg } from "./lib.mjs";
import {
  SR,
  bass,
  bell,
  buffer,
  envelope,
  fadeOut,
  highpass,
  lowpass,
  midiHz,
  mixIn,
  noise,
  pad,
  pluck,
  reverb,
  rng,
  writeWav,
} from "./synth.mjs";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
// Scale-degree chords: I vi IV V, then IV I V I for the answer phrase.
const PHRASES = [
  [0, 5, 3, 4],
  [0, 5, 3, 4],
  [3, 0, 4, 0],
  [0, 5, 3, 4],
];

function chordNotes(root, degree) {
  return [0, 2, 4].map((k) => {
    const d = degree + k;
    return root + MAJOR[d % 7] + 12 * Math.floor(d / 7);
  });
}

function nearest(options, target) {
  return options.reduce((best, n) => (Math.abs(n - target) < Math.abs(best - target) ? n : best), options[0]);
}

/** A melody line for one bar: [beatOffset, midi, beats] … */
function barMelody(r, root, degree, beatsPerBar, prev, lively) {
  const rhythms = lively
    ? [[1, 1, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 2], [1, 0.5, 0.5, 2]]
    : [[1, 1, 1], [2, 1], [1, 0.5, 0.5, 1], [3], [1.5, 0.5, 1]];
  const rhythm = rhythms[Math.floor(r() * rhythms.length)];
  const chord = chordNotes(root, degree);
  const pool = [];
  for (const oct of [12, 24]) for (const n of chord) pool.push(n + oct);
  const scale = [];
  for (const oct of [12, 24]) for (const s of [0, 2, 4, 7, 9]) scale.push(root + s + oct);
  const notes = [];
  let t = 0;
  let last = prev;
  for (const len of rhythm) {
    if (t >= beatsPerBar) break;
    const onBeat = Number.isInteger(t);
    const choices = onBeat ? pool : scale;
    const target = last + Math.round((r() - 0.5) * 6);
    const n = nearest(choices, Math.max(root + 12, Math.min(root + 28, target)));
    notes.push([t, n, len]);
    last = n;
    t += len;
  }
  return { notes, last };
}

function compose(story, total) {
  const lively = story.mood === "playful";
  const seed = story.music?.seed ?? 1;
  const bpm = story.music?.bpm ?? (lively ? 104 : 66);
  const beatsPerBar = lively ? 4 : 3;
  const beat = 60 / bpm;
  const bar = beat * beatsPerBar;
  const root = lively ? 60 : 65; // C major for playful, F major for bedtime
  const r = rng(seed);
  const buf = buffer(total + 3);

  // Write each phrase once, then repeat it: repetition is what makes a tune.
  const written = PHRASES.map((chords) => {
    let prev = root + 19;
    return chords.map((deg) => {
      const m = barMelody(r, root, deg, beatsPerBar, prev, lively);
      prev = m.last;
      return m.notes;
    });
  });

  let t = 0.4;
  let barIndex = 0;
  while (t < total) {
    const phrase = Math.floor(barIndex / 4) % PHRASES.length;
    const inPhrase = barIndex % 4;
    const degree = PHRASES[phrase][inPhrase];
    const chord = chordNotes(root, degree);

    // pad (detuned left/right) or strummed plucks
    if (lively) {
      for (let b = 0; b < beatsPerBar; b++) {
        chord.forEach((n, k) => mixIn(buf, t + b * beat + k * 0.018, pluck(midiHz(n), 1.1, barIndex * 10 + b * 3 + k), 0.12, -0.3 + k * 0.3));
      }
    } else {
      chord.forEach((n) => {
        mixIn(buf, t, pad(midiHz(n - 12), bar + 0.6, -0.0015), 0.07, -0.6);
        mixIn(buf, t, pad(midiHz(n - 12), bar + 0.6, 0.0015), 0.07, 0.6);
      });
    }

    // bass on the downbeat (and beat 3 in 4/4)
    mixIn(buf, t, bass(midiHz(chord[0] - 24), bar * 0.9), 0.32, 0);
    if (lively) mixIn(buf, t + 2 * beat, bass(midiHz(chord[2] - 24), beat * 1.5), 0.22, 0);

    // melody (rests on the very first phrase of a bedtime song, to start soft)
    if (lively || barIndex >= 2) {
      for (const [off, n, len] of written[phrase][inPhrase]) {
        mixIn(buf, t + off * beat, bell(midiHz(n), Math.max(1.6, len * beat + 1), lively ? 0.5 : 0.95), lively ? 0.22 : 0.26, 0.25);
      }
    }

    // shaker on the off-beats for playful songs
    if (lively) {
      for (let k = 0; k < beatsPerBar * 2; k++) {
        const hit = envelope(highpass(noise(0.08, barIndex * 50 + k), 6000), (s) => Math.exp(-s / 0.02));
        mixIn(buf, t + k * beat * 0.5, hit, k % 2 ? 0.05 : 0.025, 0.4);
      }
    }

    t += bar;
    barIndex++;
  }
  reverb(buf, lively ? 0.18 : 0.32);
  fadeOut(buf, 3);
  return buf;
}

// ---------- sound effects ----------

function sfx(name) {
  switch (name) {
    case "twinkle": {
      const b = buffer(2.4);
      [84, 88, 91, 96].forEach((m, i) => mixIn(b, i * 0.075, bell(midiHz(m), 2, 0.6), 0.5, -0.4 + i * 0.25));
      reverb(b, 0.3);
      return b;
    }
    case "whoosh": {
      const b = buffer(1.0);
      const n = lowpass(noise(1.0, 3), (t) => 300 + 2600 * Math.sin(Math.PI * Math.min(1, t / 0.9)));
      const shaped = envelope(n, (t) => Math.sin(Math.PI * Math.min(1, t / 0.95)) ** 2);
      mixIn(b, 0, shaped, 1, -0.5);
      mixIn(b, 0.03, shaped, 1, 0.5);
      return b;
    }
    case "pop": {
      const b = buffer(0.3);
      const s = new Float32Array(Math.round(0.2 * SR)).map((_, i) => {
        const t = i / SR;
        return Math.sin(2 * Math.PI * (650 * t - 1100 * t * t)) * Math.exp(-t / 0.045);
      });
      mixIn(b, 0, s, 1, 0);
      return b;
    }
    case "hoot": {
      const b = buffer(2.0);
      const hoo = (len, f0) => {
        const breath = lowpass(noise(len, 9), 900);
        return new Float32Array(Math.round(len * SR)).map((_, i) => {
          const t = i / SR;
          const env = Math.sin(Math.PI * Math.min(1, t / len)) ** 1.5;
          const f = f0 * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, t / len)));
          return env * (Math.sin(2 * Math.PI * f * t) + 0.2 * breath[i]);
        });
      };
      mixIn(b, 0.05, hoo(0.32, 360), 0.8, 0.2);
      mixIn(b, 0.55, hoo(0.55, 330), 0.8, 0.2);
      reverb(b, 0.35);
      return b;
    }
    case "flap": {
      const b = buffer(1.2);
      for (let k = 0; k < 5; k++) {
        const thump = envelope(lowpass(noise(0.14, 20 + k), 700), (t) => Math.sin(Math.PI * Math.min(1, t / 0.14)));
        mixIn(b, k * 0.17, thump, 1 - k * 0.15, (k % 2) * 0.4 - 0.2);
      }
      return b;
    }
    case "waves": {
      // 8 s seamless loop: the swell is periodic and the tail crossfades into the head.
      const len = 8;
      const x = 1;
      const raw = lowpass(noise(len + x, 31), (t) => 400 + 500 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 4)));
      const swell = envelope(raw, (t) => 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 4 - Math.PI / 2)));
      const loop = new Float32Array(Math.round(len * SR));
      const xs = Math.round(x * SR);
      for (let i = 0; i < loop.length; i++) {
        loop[i] = swell[i];
        if (i < xs) {
          const g = i / xs;
          loop[i] = swell[i] * g + swell[i + loop.length] * (1 - g);
        }
      }
      const b = buffer(len);
      mixIn(b, 0, loop, 1, -0.3);
      mixIn(b, 0, loop.slice().reverse(), 0.8, 0.3);
      return b;
    }
    case "crickets": {
      const len = 6;
      const b = buffer(len);
      const r = rng(77);
      for (let t = 0.1; t < len - 0.5; t += 0.5 + r() * 0.9) {
        const pan = r() * 1.4 - 0.7;
        for (let k = 0; k < 3; k++) {
          const chirp = new Float32Array(Math.round(0.035 * SR)).map((_, i) => {
            const s = i / SR;
            return Math.sin(2 * Math.PI * 4400 * s) * Math.sin((Math.PI * s) / 0.035);
          });
          mixIn(b, t + k * 0.06, chirp, 0.3, pan);
        }
      }
      return b;
    }
    default:
      throw new Error(`Unknown sound ${name}`);
  }
}

export const SFX = ["twinkle", "whoosh", "pop", "hoot", "flap", "waves", "crickets"];

const id = storyArg();
const story = loadStory(id);
const force = process.argv.includes("--force");

for (const name of SFX) {
  const file = path.join(PUBLIC, "sfx", `${name}.wav`);
  if (force || !existsSync(file)) {
    writeWav(file, sfx(name), name === "crickets" || name === "waves" ? -6 : -3);
    console.log(`sfx  ${path.relative(process.cwd(), file)}`);
  }
}

const timingFile = path.join(PUBLIC, id, "timing.json");
const total = existsSync(timingFile) ? JSON.parse(readFileSync(timingFile, "utf8")).total : estimateTiming(story).total;
const out = path.join(PUBLIC, id, "music.wav");
writeWav(out, compose(story, total), -4);
console.log(`music ${path.relative(process.cwd(), out)} (${total.toFixed(1)} s, ${story.mood})`);
