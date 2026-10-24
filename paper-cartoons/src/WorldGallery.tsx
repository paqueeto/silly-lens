import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import "./assets.ts";
import { FeltDefs } from "./kit/felt.tsx";
import { Character, type CharacterSpec } from "./kit/critters.tsx";
import { Thing } from "./kit/nature.tsx";
import { FONT } from "./kit/overlays.tsx";
import { WORLD_NAMES, WORLDS, World } from "./kit/worlds.tsx";

export const WORLD_SECONDS = 3;

const CAST: CharacterSpec[] = [
  { kind: "fox" },
  { kind: "owl" },
  { kind: "bunny" },
  { kind: "bear", scarf: "#d9534f" },
  { kind: "hedgehog" },
];

/** Every world template with a character standing in it, 3 s each. */
export const WorldGallery: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <FeltDefs />
      {WORLD_NAMES.map((name, i) => {
        const w = WORLDS[name];
        return (
          <Sequence key={name} from={i * WORLD_SECONDS * fps} durationInFrames={WORLD_SECONDS * fps}>
            <svg viewBox="0 0 1920 1080" width="100%" height="100%">
              <World name={name} />
              <Character spec={CAST[i]} x={760} y={w.groundAt(760)} />
              <Thing kind={w.thing} x={1060} y={w.groundAt(1060) - 80} size={44} />
              <World name={name} layer="front" />
              <text
                x={960}
                y={90}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={700}
                fontSize={60}
                fill={w.mood === "bedtime" ? "#fff3d6" : "#3a2448"}
              >
                {name}
              </text>
            </svg>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
