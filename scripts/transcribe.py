# Transcribe a song with word timings (faster-whisper, runs locally on CPU).
#   python3 -m venv .venv && .venv/bin/pip install faster-whisper
#   .venv/bin/python scripts/transcribe.py public/<id>/song.mp3 medium out/<id>.whisper.json
# Then: npm run lyrics -- <id> out/<id>.whisper.json   (and correct any misheard words by hand)
import json, subprocess, sys, time
import numpy as np
from faster_whisper import WhisperModel
audio, model_name, out = sys.argv[1], sys.argv[2], sys.argv[3]
t = time.time()
m = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
segs, info = m.transcribe(samples, language=None if len(sys.argv) > 5 and sys.argv[5] == "auto" else (sys.argv[5] if len(sys.argv) > 5 else "es"), word_timestamps=True, vad_filter=False, beam_size=5,
                          condition_on_previous_text=False, initial_prompt=sys.argv[4] if len(sys.argv) > 4 else None)
res = []
for s in segs:
    res.append({"start": s.start, "end": s.end, "text": s.text.strip(),
                "words": [{"w": w.word.strip(), "start": w.start, "end": w.end, "p": round(w.probability, 2)} for w in (s.words or [])]})
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}", flush=True)
json.dump(res, open(out, "w"), ensure_ascii=False, indent=1)
print(f"done in {time.time()-t:.0f}s", file=sys.stderr)
