import React from "react";
import { AbsoluteFill } from "remotion";
import "./assets.ts";
import { FeltDefs } from "./kit/felt.tsx";
import { Boat, Cloud, Hills, HangingStar, Island, Lighthouse, Moon, PineTree, RoundTree, Sky, Sparkles, WaveBand } from "./kit/nature.tsx";
import { Critter, Owl } from "./kit/critters.tsx";
import { FONT } from "./kit/overlays.tsx";

/** Every kit piece on one stage — open it in the studio when building scenes. */
export const KitGallery: React.FC = () => (
  <AbsoluteFill>
    <FeltDefs />
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <Sky top="#2a3170" bottom="#8a8fd0" />
      <Sparkles count={30} seed={2} area={[0, 0, 1920, 400]} />
      <Moon x={1720} y={150} r={70} />
      <Cloud x={420} y={200} w={300} color="#c9cdf0" seed={1} />
      <Cloud x={1150} y={160} w={240} color="#b9bde8" seed={4} />
      {[220, 560, 900, 1240].map((x, i) => (
        <HangingStar key={x} x={x} length={110 + (i % 2) * 70} size={34} lit={i % 2} face={i > 1} seed={i} />
      ))}
      <Hills y={640} color="#4c7a5a" height={70} seed={2} />
      <RoundTree x={150} y={660} size={110} />
      <PineTree x={1480} y={650} size={170} />
      <Lighthouse x={1760} y={700} scale={0.7} />
      <Island x={1760} y={715} w={220} />
      <WaveBand y={720} color="#2c4f8f" amp={12} length={220} speed={20} />
      <WaveBand y={800} color="#3a6db0" amp={14} length={200} speed={-24} />
      <Boat x={1350} y={790} scale={0.6} />
      <WaveBand y={880} color="#4a80c0" amp={16} length={190} speed={28} />
      <Owl x={190} y={1020} scale={0.8} />
      {(["mouse", "bunny", "bear", "fox", "cat", "hedgehog"] as const).map((k, i) => (
        <Critter key={k} kind={k} x={430 + i * 240} y={1030} scale={0.75} scarf={i === 2 ? "#d9534f" : undefined} look={0.4} />
      ))}
      <text x={960} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={54} fill="#fff3d6">
        Felt &amp; paper kit
      </text>
    </svg>
  </AbsoluteFill>
);
