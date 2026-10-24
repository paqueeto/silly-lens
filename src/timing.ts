// Shared by the Remotion bundle and the Node scripts (Node runs this file with
// built-in type stripping), so: erasable TypeScript only, `.ts` import paths.
import type { LineTime, SceneTime, StorySpec, Timing, WordTime } from "./types.ts";

export const TITLE_SECONDS = 4;
export const LEAD_SECONDS = 0.9;
export const GAP_SECONDS = 0.55;
export const TAIL_SECONDS = 1.4;
export const OUTRO_SECONDS = 5;

/** Remove ElevenLabs audio tags such as [softly] and tidy the spacing. */
export function stripTags(text: string): string {
  return text.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

const WORD_RE = /[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g;

export function splitWords(text: string): string[] {
  return stripTags(text).match(WORD_RE) ?? [];
}

/**
 * A calm storyteller pace (~140 wpm) with breath at punctuation. Used until
 * real narration exists, so scene lengths are close to the final cut.
 */
export function estimateLine(text: string): { duration: number; words: WordTime[] } {
  const clean = stripTags(text);
  const words = splitWords(clean);
  const pauses =
    (clean.match(/[,;:]/g)?.length ?? 0) * 0.25 +
    (clean.match(/\.\.\.|…|—/g)?.length ?? 0) * 0.45 +
    Math.max(0, (clean.match(/[.!?]/g)?.length ?? 0) - 1) * 0.35;
  const speaking = words.reduce((sum, w) => sum + 0.18 + w.length * 0.055, 0);
  const duration = 0.2 + speaking + pauses;
  const scale = speaking > 0 ? (duration - 0.2) / speaking : 0;
  let t = 0.1;
  const timed = words.map((w) => {
    const len = (0.18 + w.length * 0.055) * scale;
    const word = { w, start: t, end: t + len * 0.85 };
    t += len;
    return word;
  });
  return { duration, words: timed };
}

export type LineAudio = { duration: number; words: WordTime[]; audio?: string };

/** Lay scenes out on one timeline from per-line durations (estimated or real). */
export function layoutTiming(
  story: StorySpec,
  lineAudio: (sceneIndex: number, lineIndex: number) => LineAudio,
  estimated: boolean,
): Timing {
  let t = TITLE_SECONDS;
  const scenes: SceneTime[] = story.scenes.map((scene, si) => {
    const start = t;
    t += LEAD_SECONDS;
    const lines: LineTime[] = scene.lines.map((text, li) => {
      const a = lineAudio(si, li);
      const lineStart = t;
      t += a.duration;
      const line: LineTime = {
        text: stripTags(text),
        audio: a.audio,
        start: lineStart,
        end: t,
        words: a.words.map((w) => ({ w: w.w, start: lineStart + w.start, end: lineStart + w.end })),
      };
      if (li < scene.lines.length - 1) t += GAP_SECONDS;
      return line;
    });
    t += TAIL_SECONDS + (scene.hold ?? 0);
    return { id: scene.id, start, end: t, lines };
  });
  const outro = { start: t, end: t + OUTRO_SECONDS };
  return {
    storyId: story.id,
    estimated,
    total: outro.end,
    title: { start: 0, end: TITLE_SECONDS },
    outro,
    scenes,
  };
}

export function estimateTiming(story: StorySpec): Timing {
  return layoutTiming(story, (si, li) => estimateLine(story.scenes[si].lines[li]), true);
}

/** Find when each `pop` word is spoken, in order, inside a scene. */
export function findWordTimes(scene: SceneTime, targets: string[]): (WordTime | null)[] {
  const words = scene.lines.flatMap((l) => l.words);
  let from = 0;
  return targets.map((target) => {
    const want = normalizeWord(target);
    for (let i = from; i < words.length; i++) {
      if (normalizeWord(words[i].w) === want) {
        from = i + 1;
        return words[i];
      }
    }
    return null;
  });
}
