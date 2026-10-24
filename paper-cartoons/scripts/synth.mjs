// Tiny offline synth: everything the films hear is written here as numbers.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const SR = 44100;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

/** Stereo buffer of `seconds`. */
export function buffer(seconds) {
  const n = Math.ceil(seconds * SR);
  return { L: new Float32Array(n), R: new Float32Array(n), n };
}

/** Add a mono voice into the buffer at time t with gain and pan (-1 … 1). */
export function mixIn(buf, t, samples, gain = 1, pan = 0) {
  const start = Math.round(t * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < samples.length; i++) {
    const j = start + i;
    if (j < 0) continue;
    if (j >= buf.n) break;
    buf.L[j] += samples[i] * gl;
    buf.R[j] += samples[i] * gr;
  }
}

/** Music-box / bell note: slightly inharmonic partials, quick attack, long decay. */
export function bell(freq, seconds = 2.2, decay = 0.9) {
  const n = Math.ceil(seconds * SR);
  const out = new Float32Array(n);
  const partials = [
    [1, 1, decay],
    [2.001, 0.35, decay * 0.55],
    [3.98, 0.12, decay * 0.25],
    [5.4, 0.05, decay * 0.12],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.004);
    let v = 0;
    for (const [mul, amp, tau] of partials) v += amp * Math.exp(-t / tau) * Math.sin(2 * Math.PI * freq * mul * t);
    out[i] = v * attack;
  }
  return out;
}

/** Soft pad: odd harmonics, slow swell, gentle vibrato. */
export function pad(freq, seconds, detune = 0) {
  const n = Math.ceil(seconds * SR);
  const out = new Float32Array(n);
  const f = freq * (1 + detune);
  const atk = Math.min(0.8, seconds * 0.3);
  const rel = Math.min(1.2, seconds * 0.4);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / atk) * Math.min(1, (seconds - t) / rel);
    const vib = 1 + 0.003 * Math.sin(2 * Math.PI * 4.6 * t);
    const ph = 2 * Math.PI * f * vib * t;
    out[i] = env * (Math.sin(ph) + Math.sin(3 * ph) / 9 + Math.sin(5 * ph) / 25);
  }
  return out;
}

/** Round bass note. */
export function bass(freq, seconds = 1.2) {
  const n = Math.ceil(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.01) * Math.exp(-t / 0.55);
    out[i] = env * (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(4 * Math.PI * freq * t));
  }
  return out;
}

/** Plucked string (Karplus–Strong), ukulele-ish. */
export function pluck(freq, seconds = 1.4, seed = 1) {
  const r = rng(seed);
  const n = Math.ceil(seconds * SR);
  const out = new Float32Array(n);
  const period = Math.max(2, Math.round(SR / freq));
  const line = new Float32Array(period).map(() => r() * 2 - 1);
  let idx = 0;
  for (let i = 0; i < n; i++) {
    const next = (idx + 1) % period;
    const v = 0.5 * (line[idx] + line[next]) * 0.996;
    out[i] = line[idx];
    line[idx] = v;
    idx = next;
  }
  return out;
}

export function noise(seconds, seed = 1) {
  const r = rng(seed);
  return new Float32Array(Math.ceil(seconds * SR)).map(() => r() * 2 - 1);
}

/** One-pole low-pass; cutoff may be a function of time in seconds. */
export function lowpass(x, cutoff) {
  const out = new Float32Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof cutoff === "function" ? cutoff(i / SR) : cutoff;
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    y += a * (x[i] - y);
    out[i] = y;
  }
  return out;
}

export function highpass(x, cutoff) {
  const lp = lowpass(x, cutoff);
  return x.map((v, i) => v - lp[i]);
}

export function envelope(x, fn) {
  return x.map((v, i) => v * fn(i / SR));
}

/** Two cross-fed, softened delays: a cheap, gentle room. */
export function reverb(buf, mix = 0.28) {
  const dl = Math.round(0.297 * SR);
  const dr = Math.round(0.371 * SR);
  const fb = 0.45;
  const wl = new Float32Array(buf.n);
  const wr = new Float32Array(buf.n);
  for (let i = 0; i < buf.n; i++) {
    if (i >= dl) wl[i] = buf.R[i - dl] + fb * wr[i - dl];
    if (i >= dr) wr[i] = buf.L[i - dr] + fb * wl[i - dr];
  }
  const sl = lowpass(wl, 3500);
  const sr = lowpass(wr, 3500);
  for (let i = 0; i < buf.n; i++) {
    buf.L[i] += mix * sl[i];
    buf.R[i] += mix * sr[i];
  }
}

export function fadeOut(buf, seconds) {
  const k = Math.round(seconds * SR);
  for (let i = 0; i < k && i < buf.n; i++) {
    const g = i / k;
    buf.L[buf.n - 1 - i] *= g;
    buf.R[buf.n - 1 - i] *= g;
  }
}

/** Normalise to a peak level and write a 16-bit stereo WAV. */
export function writeWav(file, buf, peakDb = -3) {
  let peak = 1e-9;
  for (let i = 0; i < buf.n; i++) peak = Math.max(peak, Math.abs(buf.L[i]), Math.abs(buf.R[i]));
  const gain = 10 ** (peakDb / 20) / peak;
  const data = Buffer.alloc(buf.n * 4);
  for (let i = 0; i < buf.n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.L[i] * gain)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf.R[i] * gain)) * 32767), i * 4 + 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.concat([header, data]));
}
