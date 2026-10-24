import React from "react";
import { AbsoluteFill, Html5Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./assets.ts";
import { FeltDefs } from "./kit/felt.tsx";
import { SceneContext } from "./kit/scene.tsx";
import { Caption, EndCard, MissingScene, PaperWipe, TitleCard, WordPops } from "./kit/overlays.tsx";
import { findWordTimes } from "./timing.ts";
import type { SfxCue, StorySpec, Timing } from "./types.ts";

export type SceneComponents = Record<string, React.FC>;

export type FilmProps = {
  storyId: string;
  /** "auto" shows subtitles only while there is no real narration. */
  captions: "auto" | "on" | "off";
  // Filled in by calculateMetadata (Root.tsx):
  timing?: Timing;
  hasMusic?: boolean;
  hasSfx?: boolean;
};

type Props = FilmProps & { spec: StorySpec; scenes: SceneComponents };

const MUSIC_VOLUME = 0.34;
const MUSIC_UNDER_VOICE = 0.13;

export const Film: React.FC<Props> = ({ spec, scenes, timing, captions, hasMusic, hasSfx }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  if (!timing) return null;
  const f = (s: number) => Math.round(s * fps);
  const lines = timing.scenes.flatMap((s) => s.lines);
  const voiced = lines.some((l) => l.audio);
  const showCaptions = captions === "on" || (captions === "auto" && !voiced);
  const current = lines.find((l) => frame >= f(l.start) && frame < f(l.end) + f(0.3));

  // Music dips under the narrator and fades at both ends.
  const musicVolume = (fr: number) => {
    const fade = interpolate(fr, [0, fps * 1.5, durationInFrames - fps * 4, durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    if (!voiced) return MUSIC_VOLUME * fade;
    const t = fr / fps;
    let duck = 0;
    for (const l of lines) {
      if (!l.audio) continue;
      const k = interpolate(t, [l.start - 0.3, l.start, l.end, l.end + 0.5], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      duck = Math.max(duck, k);
    }
    return (MUSIC_VOLUME + (MUSIC_UNDER_VOICE - MUSIC_VOLUME) * duck) * fade;
  };

  const cuts = [...timing.scenes.map((s) => s.start), timing.outro.start];

  return (
    <AbsoluteFill style={{ background: "#1f2452" }}>
      <FeltDefs />

      <Sequence durationInFrames={f(timing.title.end) + 1} name="Title">
        <TitleCard title={spec.title} mood={spec.mood} />
      </Sequence>

      {timing.scenes.map((st, i) => {
        const sceneSpec = spec.scenes[i];
        const Scene = scenes[st.id];
        const from = f(st.start);
        const duration = f(st.end) - from;
        const popFrames = findWordTimes(st, sceneSpec.pop ?? []);
        const pops = (sceneSpec.pop ?? [])
          .map((word, k) => ({ word, frame: popFrames[k] ? f(popFrames[k]!.start) - from : -1 }))
          .filter((p) => p.frame >= 0);
        return (
          <Sequence key={st.id} from={from} durationInFrames={duration + 1} name={`Scene ${st.id}`}>
            <SceneContext.Provider value={{ scene: st, duration }}>
              {Scene ? <Scene /> : <MissingScene id={st.id} lines={st.lines.map((l) => l.text)} />}
              <WordPops words={pops} duration={duration} seed={i + 1} />
            </SceneContext.Provider>
            {hasSfx ? <SceneSfx cues={sceneSpec.sfx ?? []} sceneStart={st.start} duration={duration} words={st} /> : null}
          </Sequence>
        );
      })}

      <Sequence from={f(timing.outro.start)} name="The End">
        <EndCard mood={spec.mood} from={0} />
      </Sequence>

      {cuts.map((c, i) => (
        <PaperWipe key={i} at={f(c)} seed={i + 2} color={i % 2 ? "#f3dcc0" : "#f4e6c8"} />
      ))}

      {showCaptions ? <Caption text={current?.text ?? null} /> : null}

      {/* Audio */}
      {hasMusic ? <Html5Audio src={staticFile(`${spec.id}/music.wav`)} volume={musicVolume} /> : null}
      {lines.map((l, i) =>
        l.audio ? (
          <Sequence key={i} from={f(l.start)} durationInFrames={f(l.end - l.start) + f(0.5)} name={`Voice ${i + 1}`}>
            <Html5Audio src={staticFile(l.audio)} />
          </Sequence>
        ) : null,
      )}
      {hasSfx
        ? cuts.map((c, i) => (
            <Sequence key={`w${i}`} from={Math.max(0, f(c) - f(0.45))} durationInFrames={f(1.2)}>
              <Html5Audio src={staticFile("sfx/whoosh.wav")} volume={0.32} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

const SceneSfx: React.FC<{ cues: SfxCue[]; sceneStart: number; duration: number; words: Timing["scenes"][number] }> = ({
  cues,
  sceneStart,
  duration,
  words,
}) => {
  const { fps } = useVideoConfig();
  const onWords = findWordTimes(
    words,
    cues.filter((c) => c.on).map((c) => c.on!),
  );
  let k = 0;
  return (
    <>
      {cues.map((cue, i) => {
        const src = staticFile(`sfx/${cue.sound}.wav`);
        if (cue.loop) {
          const fadeFrames = Math.round(fps * 0.8);
          return (
            <Html5Audio
              key={i}
              src={src}
              loop
              volume={(fr) =>
                (cue.volume ?? 0.25) *
                interpolate(fr, [0, fadeFrames, duration - fadeFrames, duration], [0, 1, 1, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              }
            />
          );
        }
        let at: number | null = null;
        if (cue.on) {
          const w = onWords[k++];
          at = w ? Math.round((w.start - sceneStart) * fps) : null;
        } else if (cue.at !== undefined) at = Math.round(cue.at * fps);
        if (at === null || at >= duration) return null;
        return (
          <Sequence key={i} from={Math.max(0, at)} durationInFrames={Math.round(fps * 3)}>
            <Html5Audio src={src} volume={cue.volume ?? 0.5} />
          </Sequence>
        );
      })}
    </>
  );
};
