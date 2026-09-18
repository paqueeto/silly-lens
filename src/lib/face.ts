export type Pt = { x: number; y: number };

export type FaceFrame = {
  nose: Pt;
  forehead: Pt;
  chin: Pt;
  leftEye: Pt;
  rightEye: Pt;
  leftCheek: Pt;
  rightCheek: Pt;
  mouth: Pt;
  faceWidth: number;
  faceHeight: number;
  roll: number;
};

export type LandmarkLike = { x: number; y: number };

const IDX = {
  nose: 1,
  forehead: 10,
  chin: 152,
  eyeA: 33,
  eyeB: 263,
  cheekA: 234,
  cheekB: 454,
  mouthA: 61,
  mouthB: 291,
  upperLip: 13,
} as const;

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function pick(lms: LandmarkLike[], i: number): LandmarkLike | null {
  const lm = lms[i];
  if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y)) return null;
  return lm;
}

export function faceFromLandmarks(
  lms: LandmarkLike[],
  width: number,
  height: number,
  mirror: boolean,
): FaceFrame | null {
  const pt = (i: number): Pt | null => {
    const lm = pick(lms, i);
    if (!lm) return null;
    return {
      x: (mirror ? 1 - lm.x : lm.x) * width,
      y: lm.y * height,
    };
  };

  const nose = pt(IDX.nose);
  const forehead = pt(IDX.forehead);
  const chin = pt(IDX.chin);
  const eyeA = pt(IDX.eyeA);
  const eyeB = pt(IDX.eyeB);
  const cheekA = pt(IDX.cheekA);
  const cheekB = pt(IDX.cheekB);
  const mouthA = pt(IDX.mouthA);
  const mouthB = pt(IDX.mouthB);
  const lip = pt(IDX.upperLip);

  if (!nose || !forehead || !chin || !eyeA || !eyeB || !cheekA || !cheekB || !mouthA || !mouthB) {
    return null;
  }

  const leftEye = eyeA.x <= eyeB.x ? eyeA : eyeB;
  const rightEye = eyeA.x <= eyeB.x ? eyeB : eyeA;
  const leftCheek = cheekA.x <= cheekB.x ? cheekA : cheekB;
  const rightCheek = cheekA.x <= cheekB.x ? cheekB : cheekA;
  const mouth = lip ?? {
    x: (mouthA.x + mouthB.x) / 2,
    y: (mouthA.y + mouthB.y) / 2,
  };

  const faceWidth = Math.max(24, dist(leftCheek, rightCheek) * 1.08);
  const faceHeight = Math.max(24, dist(forehead, chin));
  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

  return {
    nose,
    forehead,
    chin,
    leftEye,
    rightEye,
    leftCheek,
    rightCheek,
    mouth,
    faceWidth,
    faceHeight,
    roll,
  };
}

export function fallbackFace(width: number, height: number): FaceFrame {
  const cx = width / 2;
  const cy = height * 0.44;
  const faceWidth = Math.min(width, height) * 0.42;
  const faceHeight = faceWidth * 1.25;
  return {
    nose: { x: cx, y: cy + faceHeight * 0.04 },
    forehead: { x: cx, y: cy - faceHeight * 0.42 },
    chin: { x: cx, y: cy + faceHeight * 0.5 },
    leftEye: { x: cx - faceWidth * 0.22, y: cy - faceHeight * 0.08 },
    rightEye: { x: cx + faceWidth * 0.22, y: cy - faceHeight * 0.08 },
    leftCheek: { x: cx - faceWidth * 0.48, y: cy + faceHeight * 0.06 },
    rightCheek: { x: cx + faceWidth * 0.48, y: cy + faceHeight * 0.06 },
    mouth: { x: cx, y: cy + faceHeight * 0.22 },
    faceWidth,
    faceHeight,
    roll: 0,
  };
}

export function smoothFace(prev: FaceFrame | null, next: FaceFrame, amount = 0.4): FaceFrame {
  if (!prev) return next;
  return {
    nose: lerpPt(prev.nose, next.nose, amount),
    forehead: lerpPt(prev.forehead, next.forehead, amount),
    chin: lerpPt(prev.chin, next.chin, amount),
    leftEye: lerpPt(prev.leftEye, next.leftEye, amount),
    rightEye: lerpPt(prev.rightEye, next.rightEye, amount),
    leftCheek: lerpPt(prev.leftCheek, next.leftCheek, amount),
    rightCheek: lerpPt(prev.rightCheek, next.rightCheek, amount),
    mouth: lerpPt(prev.mouth, next.mouth, amount),
    faceWidth: lerp(prev.faceWidth, next.faceWidth, amount),
    faceHeight: lerp(prev.faceHeight, next.faceHeight, amount),
    roll: lerpAngle(prev.roll, next.roll, amount),
  };
}

export function studioFace(width: number, height: number, bobY: number): FaceFrame {
  const cx = width / 2;
  const cy = height * 0.44 + bobY;
  const r = Math.min(width, height) * 0.22;
  return {
    nose: { x: cx, y: cy + r * 0.16 },
    forehead: { x: cx, y: cy - r * 0.9 },
    chin: { x: cx, y: cy + r * 0.98 },
    leftEye: { x: cx - r * 0.38, y: cy - r * 0.1 },
    rightEye: { x: cx + r * 0.38, y: cy - r * 0.1 },
    leftCheek: { x: cx - r * 0.82, y: cy + r * 0.18 },
    rightCheek: { x: cx + r * 0.82, y: cy + r * 0.18 },
    mouth: { x: cx, y: cy + r * 0.5 },
    faceWidth: r * 1.72,
    faceHeight: r * 1.92,
    roll: 0,
  };
}
