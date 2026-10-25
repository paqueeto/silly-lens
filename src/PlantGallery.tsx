import React from "react";
import { AbsoluteFill } from "remotion";
import "./assets.ts";
import { FeltDefs, MaterialContext } from "./kit/felt.tsx";
import { Crown, CutoutWord, Drop, MonsteraLeaf, Monstera, MossPole, Pot, type LeafSpec } from "./kit/plant.tsx";

const LEAVES: LeafSpec[] = [
  { angle: -48, reach: 260, size: 230, seed: 1 },
  { angle: 38, reach: 300, size: 250, seed: 2 },
  { angle: -10, reach: 420, size: 270, seed: 3 },
  { angle: 70, reach: 200, size: 190, seed: 4 },
  { angle: -78, reach: 180, size: 170, seed: 5 },
];

/** Plant kit preview, in heavy felt. */
export const PlantGallery: React.FC = () => (
  <MaterialContext.Provider value="felt">
    <AbsoluteFill style={{ background: "#e8d9c0" }}>
      <FeltDefs />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <rect width={1920} height={1080} fill="#efe0c6" filter="url(#felt-heavy-flat)" />
        <rect y={800} width={1920} height={280} fill="#c9a77e" filter="url(#felt-heavy-flat)" />
        {[0, 0.5, 1].map((u, i) => (
          <MonsteraLeaf key={i} x={150 + i * 230} y={420} size={190} unfurl={u === 0 ? 0.15 : 1} split={u} holes={u} seed={i + 1} />
        ))}
        <MonsteraLeaf x={840} y={420} size={190} split={1} holes={1} wilt={0.8} seed={9} />
        <Monstera x={1340} y={760} leaves={LEAVES} grow={[1, 1, 1, 1, 0.6]} />
        <Pot x={1340} y={780} w={300} h={240} roots={0} />
        <Pot x={420} y={850} w={180} h={170} roots={1} squeeze={0.5} />
        <MossPole x={1700} y={800} height={500} />
        <Crown x={1340} y={260} size={0.7} />
        <Drop x={1060} y={600} />
        <CutoutWord text="SURVIVOR" x={700} y={140} size={110} color="#2f8f5b" at={0} step={0} />
      </svg>
    </AbsoluteFill>
  </MaterialContext.Provider>
);
