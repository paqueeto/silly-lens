# The narrator

## Picking a voice

In ElevenLabs → Voices → Voice Library, search "storyteller", "bedtime" or "calm
narrator". Look for: warm, unhurried, clear consonants, a little smile in the voice.
Avoid breathy ASMR voices (muddy on phone speakers) and voices cloned from real
people you do not have rights to. Copy the voice ID into `ELEVEN_VOICE_ID`.

Keep **one narrator per series**; it is part of the brand.

## Model and settings

- Default model `eleven_v3`: understands audio tags. Override with `ELEVEN_MODEL`.
  If the timestamps endpoint rejects a model, `eleven_multilingual_v2` is the safe
  fallback; tags are then stripped automatically (they would be read aloud).
- `ELEVEN_STABILITY`: 0.5 (natural) is the default. Use 1.0 for a steadier, more
  even read across a long series.

Check ElevenLabs' current model list before a big batch; models and tag support
change.

## Tags that suit kids' stories

Put them at the start of a line, or before the words they colour:

- `[softly]` / `[gently]`: openings, bedtime endings
- `[whispers]`: secrets, "they whispered"
- `[warmly]`: comfort, the resolution
- `[excited]`: the big moment ("and she flew!")
- `[giggles]`, `[gasps]`: sparingly, at most once a story

Punctuation steers pacing too: "…" gives a breath, a full stop gives a beat, an
exclamation lifts the line.

## Cost control

- Lines are cached by text + voice + model + settings. Re-running is free unless a
  line changed.
- The script prints how many characters it sent. A 1-minute story is roughly 500–600
  characters.
- Write and approve the story first; voice it last.
