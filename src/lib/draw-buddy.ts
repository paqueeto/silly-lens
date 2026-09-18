import { studioFace, type FaceFrame } from "./face";

const SKIN = "#efc2a0";
const SKIN_SHADOW = "#e0a888";
const BLUSH = "rgba(201, 92, 78, 0.28)";
const INK = "#2a211c";
const SHIRT = "#c44536";
const SHIRT_DEEP = "#9e3428";
const HAIR = "#3d2a22";
const EYE = "#1a1714";
const BG = "#e7dccb";
const SPOT = "#f7f1e6";

export function drawBuddy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  reducedMotion: boolean,
): FaceFrame {
  const bob = reducedMotion ? 0 : Math.sin(time * 2.1) * 6;
  const blinkPhase = reducedMotion ? 1 : time % 4.2;
  const blink = blinkPhase > 4.02 ? Math.max(0.08, 1 - (blinkPhase - 4.02) / 0.08) : 1;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  const spot = ctx.createRadialGradient(
    width * 0.5,
    height * 0.42,
    width * 0.08,
    width * 0.5,
    height * 0.46,
    width * 0.72,
  );
  spot.addColorStop(0, SPOT);
  spot.addColorStop(1, "rgba(231, 220, 203, 0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height * 0.44 + bob;
  const r = Math.min(width, height) * 0.22;

  ctx.save();
  ctx.translate(cx, cy);

  // shoulders / shirt
  ctx.beginPath();
  ctx.moveTo(-r * 1.55, r * 2.35);
  ctx.quadraticCurveTo(-r * 1.7, r * 1.15, -r * 0.7, r * 1.05);
  ctx.quadraticCurveTo(0, r * 1.22, r * 0.7, r * 1.05);
  ctx.quadraticCurveTo(r * 1.7, r * 1.15, r * 1.55, r * 2.35);
  ctx.closePath();
  ctx.fillStyle = SHIRT;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, r * 1.12, r * 0.42, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fillStyle = SHIRT_DEEP;
  ctx.fill();

  // ears
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.ellipse(-r * 0.92, -r * 0.08, r * 0.18, r * 0.26, -0.35, 0, Math.PI * 2);
  ctx.ellipse(r * 0.92, -r * 0.08, r * 0.18, r * 0.26, 0.35, 0, Math.PI * 2);
  ctx.fill();

  // hair behind
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.55, r * 0.98, r * 0.72, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-r * 0.62, -r * 0.18, r * 0.28, r * 0.42, -0.4, 0, Math.PI * 2);
  ctx.ellipse(r * 0.62, -r * 0.18, r * 0.28, r * 0.42, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // head
  const head = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
  head.addColorStop(0, "#f6d3b6");
  head.addColorStop(0.7, SKIN);
  head.addColorStop(1, SKIN_SHADOW);
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.05, 0, 0, Math.PI * 2);
  ctx.fillStyle = head;
  ctx.fill();

  // hair bangs
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(-r * 0.78, -r * 0.35);
  ctx.quadraticCurveTo(-r * 0.5, -r * 1.12, 0, -r * 1.02);
  ctx.quadraticCurveTo(r * 0.5, -r * 1.12, r * 0.78, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.55, 0, -r * 0.42);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.55, -r * 0.78, -r * 0.35);
  ctx.fill();

  // blush
  ctx.fillStyle = BLUSH;
  ctx.beginPath();
  ctx.ellipse(-r * 0.48, r * 0.22, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.48, r * 0.22, r * 0.2, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // eyes
  ctx.fillStyle = EYE;
  const eyeH = r * 0.13 * blink;
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.08, r * 0.09, eyeH, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.32, -r * 0.08, r * 0.09, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blink > 0.4) {
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(-r * 0.29, -r * 0.13, r * 0.03, r * 0.035 * blink, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.35, -r * 0.13, r * 0.03, r * 0.035 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // brows
  ctx.strokeStyle = HAIR;
  ctx.lineWidth = r * 0.045;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 0.46, -r * 0.28);
  ctx.quadraticCurveTo(-r * 0.32, -r * 0.36, -r * 0.16, -r * 0.28);
  ctx.moveTo(r * 0.16, -r * 0.28);
  ctx.quadraticCurveTo(r * 0.32, -r * 0.36, r * 0.46, -r * 0.28);
  ctx.stroke();

  // nose
  ctx.strokeStyle = "rgba(42, 33, 28, 0.35)";
  ctx.lineWidth = r * 0.03;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.02);
  ctx.quadraticCurveTo(r * 0.08, r * 0.16, 0, r * 0.2);
  ctx.stroke();

  // smile
  ctx.strokeStyle = INK;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, r * 0.42);
  ctx.quadraticCurveTo(0, r * 0.62, r * 0.28, r * 0.42);
  ctx.stroke();

  ctx.restore();

  return studioFace(width, height, bob);
}
