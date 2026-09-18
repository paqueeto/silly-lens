let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function playShutter() {
  try {
    const ac = audio();
    if (!ac) return;
    if (ac.state === "suspended") void ac.resume();

  const now = ac.currentTime;
  const noiseLen = 0.07;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * noiseLen), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(now);
  src.stop(now + 0.1);

  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);
  const og = ac.createGain();
  og.gain.setValueAtTime(0.04, now);
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(og);
  og.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.09);
  } catch {
    /* audio is optional */
  }
}
