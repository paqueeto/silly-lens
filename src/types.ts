// Story files (src/stories/<id>/story.json) follow StorySpec. Scripts and the
// Remotion bundle both read them, so keep this file free of runtime code.

export type Mood = "bedtime" | "playful";

export type SfxCue = {
  /** File name in public/sfx without extension: twinkle, whoosh, pop, hoot, waves, crickets, flap. */
  sound: string;
  /** Play when this word is spoken in the scene (first match after the previous cue on the same word). */
  on?: string;
  /** Or play at this many seconds after the scene starts. */
  at?: number;
  volume?: number;
  /** Loop for the whole scene (ambience such as waves or crickets). */
  loop?: boolean;
};

export type StorySceneSpec = {
  id: string;
  /** Narration, one sentence or phrase per entry. ElevenLabs v3 audio tags like [softly] are allowed. */
  lines: string[];
  /** Words that pop onto the screen, in spoken order, at the moment the narrator says them. */
  pop?: string[];
  sfx?: SfxCue[];
  /** Extra seconds of picture after the last line (for a big visual moment). */
  hold?: number;
};

export type StorySpec = {
  id: string;
  title: string;
  mood: Mood;
  age: string;
  music?: { seed?: number; bpm?: number };
  scenes: StorySceneSpec[];
};

export type WordTime = { w: string; start: number; end: number };

export type LineTime = {
  text: string;
  /** Path under public/, present once real narration exists. */
  audio?: string;
  start: number;
  end: number;
  words: WordTime[];
};

export type SceneTime = { id: string; start: number; end: number; lines: LineTime[] };

/** All times are absolute seconds from the start of the film. */
export type Timing = {
  storyId: string;
  estimated: boolean;
  total: number;
  title: { start: number; end: number };
  outro: { start: number; end: number };
  scenes: SceneTime[];
};
