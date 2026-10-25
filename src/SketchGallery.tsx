import React from "react";
import { AbsoluteFill } from "remotion";
import "./assets.ts";
import { Handwriting, Person, ReachingHand, SketchDefs, SketchPlant, SketchPot, SketchSun, Sketchbook, Tangle, type SketchLeafSpec } from "./kit/sketch.tsx";

const LEAVES: SketchLeafSpec[] = [
  { angle: -48, reach: 200, size: 170, seed: 1 },
  { angle: 40, reach: 230, size: 185, seed: 2 },
  { angle: -10, reach: 310, size: 200, seed: 3 },
  { angle: 72, reach: 150, size: 140, seed: 4 },
];

/** Sketchbook kit preview: pencil (left page) and crayon (right page). */
export const SketchGallery: React.FC = () => (
  <AbsoluteFill>
    <SketchDefs />
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <Sketchbook spread />
      <SketchPlant x={330} y={700} leaves={LEAVES} wilt={0.6} split={0.3} holes={0} scale={0.9} />
      <SketchPot x={330} y={690} w={190} h={180} />
      <Tangle x={330} y={800} r={60} seed={3} />
      <Person x={700} y={900} pose={{ curl: 1, away: 1 }} scale={0.95} />
      <SketchSun x={1500} y={190} r={60} />
      <SketchPlant x={1200} y={720} leaves={LEAVES} color="#3f9a55" fill={1} scale={0.95} />
      <SketchPot x={1200} y={710} w={230} h={200} color="#d9774a" fill={1} />
      <Person x={1620} y={920} pose={{ stretch: 0.6, mood: 1 }} shirt="#5b8fd6" crown={1} />
      <ReachingHand x={1900} y={300} tx={1760} ty={480} />
      <Handwriting text="survivor" x={1060} y={150} size={90} color="#2f7a45" />
      <Handwriting text="a pot too tight..." x={90} y={150} size={70} />
    </svg>
  </AbsoluteFill>
);
