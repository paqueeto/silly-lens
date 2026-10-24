import React from "react";
import { Composition, staticFile } from "remotion";
import { Film, type FilmProps } from "./Film.tsx";
import { KitGallery } from "./KitGallery.tsx";
import { WORLD_SECONDS, WorldGallery } from "./WorldGallery.tsx";
import { WORLD_NAMES } from "./kit/worlds.tsx";
import { STORIES } from "./stories/index.ts";
import { estimateTiming, stripTags } from "./timing.ts";
import type { StorySpec, Timing } from "./types.ts";

// 24 fps: the film and stop-motion standard, and 20% fewer frames to render than 30.
export const FPS = 24;

async function exists(path: string) {
  try {
    const res = await fetch(staticFile(path), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Narration timing from `npm run narrate`, or an estimate if it is missing or out of date. */
async function loadTiming(spec: StorySpec): Promise<Timing> {
  try {
    const res = await fetch(staticFile(`${spec.id}/timing.json`));
    if (res.ok) {
      const timing = (await res.json()) as Timing;
      const fresh =
        timing.scenes.length === spec.scenes.length &&
        timing.scenes.every(
          (s, i) =>
            s.id === spec.scenes[i].id &&
            s.lines.length === spec.scenes[i].lines.length &&
            s.lines.every((l, j) => l.text === stripTags(spec.scenes[i].lines[j])),
        );
      if (fresh) return timing;
      console.warn(`${spec.id}: timing.json is out of date with story.json — using an estimate. Run npm run narrate.`);
    }
  } catch {
    // fall through to the estimate
  }
  return estimateTiming(spec);
}

const films = STORIES.map(({ spec, scenes }) => {
  const Component: React.FC<FilmProps> = (props) => <Film {...props} spec={spec} scenes={scenes} />;
  return { spec, Component };
});

export const Root: React.FC = () => (
  <>
    {films.map(({ spec, Component }) => (
      <Composition
        key={spec.id}
        id={spec.id}
        component={Component}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={FPS * 60}
        defaultProps={{ storyId: spec.id, captions: "auto" } as FilmProps}
        calculateMetadata={async ({ props }) => {
          const [timing, hasMusic, hasSfx] = await Promise.all([
            loadTiming(spec),
            exists(`${spec.id}/music.wav`),
            exists("sfx/whoosh.wav"),
          ]);
          return { durationInFrames: Math.ceil(timing.total * FPS), props: { ...props, timing, hasMusic, hasSfx } };
        }}
      />
    ))}
    <Composition id="kit" component={KitGallery} fps={FPS} width={1920} height={1080} durationInFrames={FPS * 8} />
    <Composition
      id="worlds"
      component={WorldGallery}
      fps={FPS}
      width={1920}
      height={1080}
      durationInFrames={FPS * WORLD_SECONDS * WORLD_NAMES.length}
    />
  </>
);
