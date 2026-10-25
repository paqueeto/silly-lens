import React, { createContext, useContext } from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./assets.ts";
import { FeltDefs, MaterialContext, rng } from "./kit/felt.tsx";
import { Karaoke, LyricWords } from "./kit/learning.tsx";
import { JournalLyrics } from "./kit/sketch.tsx";
import { MissingScene, PaperWipe, WordPops } from "./kit/overlays.tsx";
import { SceneContext } from "./kit/scene.tsx";
import { findWordTimes } from "./timing.ts";
import type { LineTime, SceneTime, SongSpec, Timing } from "./types.ts";

export type SongProps = { spec: SongSpec; lyrics: LineTime[]; scenes: Record<string, React.FC> };

/** Sections with their lyric lines, in the same shape stories use, so scenes can call useScene(). */
export function songTimeline(spec: SongSpec, lyrics: LineTime[]): SceneTime[] {
  return spec.sections.map((s, i) => {
    const end = spec.sections[i + 1]?.start ?? spec.duration;
    return { id: s.id, start: s.start, end, lines: lyrics.filter((l) => l.start >= s.start && l.start < end) };
  });
}

/** Timing-shaped summary, so the still/render scripts treat songs like stories. */
export function songTiming(spec: SongSpec, lyrics: LineTime[]): Timing {
  const scenes = songTimeline(spec, lyrics);
  const last = scenes[scenes.length - 1];
  return {
    storyId: spec.id,
    estimated: false,
    total: spec.duration,
    title: { start: 0, end: scenes[0]?.end ?? 0 },
    outro: { start: last.start, end: spec.duration },
    scenes,
  };
}

/** Seconds of the k-th beat at or after time t (k = 0 is the first beat from t). */
export function beatAt(spec: SongSpec, t: number, k: number) {
  const grid = [...spec.beats].reverse().find((b) => t >= b.from) ?? spec.beats[0];
  const first = Math.ceil((t - grid.first) / grid.period - 1e-6);
  return grid.first + (first + k) * grid.period;
}

const SongContext = createContext<SongSpec | null>(null);

/** Inside a song scene: frame (scene-relative) of the k-th beat from the scene start. */
export function useBeat() {
  const spec = useContext(SongContext);
  const { fps } = useVideoConfig();
  const info = useContext(SceneContext);
  if (!spec || !info) throw new Error("useBeat() must be used inside a song scene");
  const start = info.scene.start;
  return (k: number) => Math.round((beatAt(spec, start, k) - start) * fps);
}

export const SongFilm: React.FC<SongProps> = ({ spec, lyrics, scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  const timeline = songTimeline(spec, lyrics);
  return (
    <AbsoluteFill style={{ background: "#1f2452" }}>
      <SongContext.Provider value={spec}>
        <MaterialContext.Provider value={spec.material ?? "classic"}>
          <FeltDefs />
          <CameraBump on={!!spec.stopMotion}>
            {timeline.map((st, i) => {
              const section = spec.sections[i];
              const Scene = scenes[st.id];
              const from = f(st.start);
              const duration = f(st.end) - from;
              const popTimes = findWordTimes(st, section.pop ?? []);
              const pops = (section.pop ?? [])
                .map((word, k) => ({ word, frame: popTimes[k] ? f(popTimes[k]!.start) - from : -1 }))
                .filter((p) => p.frame >= 0);
              return (
                <Sequence key={st.id} from={from} durationInFrames={duration + 1} name={st.id}>
                  <SceneContext.Provider value={{ scene: st, duration }}>
                    {Scene ? <Scene /> : <MissingScene id={st.id} lines={st.lines.map((l) => l.text)} />}
                    {pops.length ? <WordPops words={pops} duration={duration} seed={i + 1} /> : null}
                  </SceneContext.Provider>
                </Sequence>
              );
            })}
          </CameraBump>
          {spec.sections.map((s, i) =>
            s.enter === "wipe" && i > 0 ? (
              <PaperWipe key={s.id} at={f(s.start)} seed={i + 2} color={i % 2 ? "#f3dcc0" : "#f4e6c8"} />
            ) : null,
          )}
          {spec.stopMotion ? <Flicker /> : null}
          {spec.karaoke === false || spec.lyricsStyle === "none" ? null : spec.lyricsStyle === "journal" ? (
            <JournalLyrics lines={lyrics} t={frame / fps} />
          ) : spec.lyricsStyle === "words" ? (
            <LyricWords lines={lyrics} t={frame / fps} />
          ) : (
            <Karaoke lines={lyrics} t={frame / fps} />
          )}
          <Html5Audio src={staticFile(spec.audio)} />
        </MaterialContext.Provider>
      </SongContext.Provider>
    </AbsoluteFill>
  );
};

/** Stop-motion exposure flicker: each frame a touch brighter or darker. */
const Flicker: React.FC = () => {
  const frame = useCurrentFrame();
  const r = rng(frame * 2654435761);
  const v = (r() - 0.5) * 0.07;
  return <AbsoluteFill style={{ background: v > 0 ? "#fff8e8" : "#000000", opacity: Math.abs(v), pointerEvents: "none" }} />;
};

/** Stop-motion camera: the whole set shifts a hair on every frame, like a nudged tripod. */
export const CameraBump: React.FC<{ children: React.ReactNode; on: boolean }> = ({ children, on }) => {
  const frame = useCurrentFrame();
  if (!on) return <>{children}</>;
  const r = rng(frame * 40503 + 7);
  const x = (r() - 0.5) * 4;
  const y = (r() - 0.5) * 4;
  return <AbsoluteFill style={{ transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(1.006)` }}>{children}</AbsoluteFill>;
};
