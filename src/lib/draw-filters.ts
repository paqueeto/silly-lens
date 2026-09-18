import type { FaceFrame, Pt } from "./face";
import type { LookId, OverlayId } from "./filters";

export const LOOK_FILTER: Record<LookId, string> = {
  natural: "none",
  sunshine: "sepia(0.2) saturate(1.32) brightness(1.07) contrast(1.04)",
  mint: "hue-rotate(52deg) saturate(1.18) brightness(1.05)",
  comic: "contrast(1.36) saturate(1.65) brightness(1.03)",
  glow: "brightness(1.13) saturate(1.18) contrast(1.05)",
  ink: "grayscale(1) contrast(1.16) brightness(1.06)",
  warm: "sepia(0.12) saturate(1.18) brightness(1.04)",
  frog: "hue-rotate(42deg) saturate(1.22) brightness(1.04)",
};

const INK = "#2a211c";

function enter(ctx: CanvasRenderingContext2D, face: FaceFrame, origin: Pt) {
  const unit = face.faceWidth / 200;
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(face.roll);
  ctx.scale(unit, unit);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
}

function enterHat(ctx: CanvasRenderingContext2D, face: FaceFrame, scale = 0.76, lift = -16) {
  enter(ctx, face, face.forehead);
  ctx.translate(0, lift);
  ctx.scale(scale, scale);
}

function paint(
  ctx: CanvasRenderingContext2D,
  fill: string,
  stroke = INK,
  width = 6,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.fill();
  ctx.stroke();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.38;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  paint(ctx, fill, INK, 3);
}

function sparkles(ctx: CanvasRenderingContext2D, time: number, count = 7) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + time * 0.55;
    const radius = 78 + Math.sin(time * 1.5 + i) * 16;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.82 - 24;
    const tw = 0.5 + 0.5 * Math.abs(Math.sin(time * 3.2 + i * 0.7));
    star(ctx, x, y, 4 + tw * 4, i % 2 === 0 ? "#fffaf3" : "#f2d38a");
  }
}

function earPair(
  ctx: CanvasRenderingContext2D,
  opts: {
    height: number;
    width: number;
    spread: number;
    y: number;
    outer: string;
    inner: string;
    floppy?: boolean;
  },
) {
  const { height, width, spread, y, outer, inner, floppy } = opts;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * spread, y);
    ctx.rotate(side * (floppy ? 0.55 : 0.18));
    ctx.beginPath();
    ctx.ellipse(0, -height / 2, width, height / 2, 0, 0, Math.PI * 2);
    paint(ctx, outer);
    ctx.beginPath();
    ctx.ellipse(0, -height / 2 + 6, width * 0.45, height * 0.32, 0, 0, Math.PI * 2);
    paint(ctx, inner, INK, 4);
    ctx.restore();
  }
}

function whiskers(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      const y = -6 + i * 12;
      ctx.beginPath();
      ctx.moveTo(side * 18, y);
      ctx.quadraticCurveTo(side * 52, y + (i - 1) * 10, side * 88, y + (i - 1) * 16);
      ctx.stroke();
    }
  }
}

function drawKitty(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  ctx.beginPath();
  ctx.moveTo(-70, 8);
  ctx.lineTo(-18, 10);
  ctx.lineTo(-48, -78);
  ctx.closePath();
  paint(ctx, "#f0c27a");
  ctx.beginPath();
  ctx.moveTo(-58, 2);
  ctx.lineTo(-30, 4);
  ctx.lineTo(-46, -52);
  ctx.closePath();
  paint(ctx, "#f4b4b0", INK, 4);
  ctx.beginPath();
  ctx.moveTo(70, 8);
  ctx.lineTo(18, 10);
  ctx.lineTo(48, -78);
  ctx.closePath();
  paint(ctx, "#f0c27a");
  ctx.beginPath();
  ctx.moveTo(58, 2);
  ctx.lineTo(30, 4);
  ctx.lineTo(46, -52);
  ctx.closePath();
  paint(ctx, "#f4b4b0", INK, 4);
  ctx.restore();

  enter(ctx, face, face.nose);
  whiskers(ctx);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-14, 10);
  ctx.lineTo(14, 10);
  ctx.closePath();
  paint(ctx, "#e07a86", INK, 4);
  ctx.restore();
}

function drawPuppy(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  earPair(ctx, {
    height: 110,
    width: 36,
    spread: 78,
    y: 18,
    outer: "#c48a4a",
    inner: "#f0c2a4",
    floppy: true,
  });
  ctx.restore();

  enter(ctx, face, face.nose);
  ctx.beginPath();
  ctx.ellipse(0, 6, 22, 16, 0, 0, Math.PI * 2);
  paint(ctx, "#3b2a22");
  ctx.beginPath();
  ctx.ellipse(6, 0, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,250,243,0.45)";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 36, 14, 22, 0.1, 0, Math.PI * 2);
  paint(ctx, "#e07a86", INK, 4);
  ctx.restore();
}


function drawBunny(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  earPair(ctx, {
    height: 168,
    width: 22,
    spread: 32,
    y: 8,
    outer: "#f3e6d4",
    inner: "#f4b4b0",
  });
  ctx.restore();
  enter(ctx, face, face.nose);
  whiskers(ctx);
  ctx.beginPath();
  ctx.ellipse(0, 4, 12, 10, 0, 0, Math.PI * 2);
  paint(ctx, "#e07a86", INK, 4);
  ctx.restore();
}

function drawFrog(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 48, -18, 38, 34, 0, 0, Math.PI * 2);
    paint(ctx, "#6faf5a");
    ctx.beginPath();
    ctx.ellipse(side * 48, -18, 22, 20, 0, 0, Math.PI * 2);
    paint(ctx, "#fffaf3");
    ctx.beginPath();
    ctx.ellipse(side * 48, -16, 12, 12, 0, 0, Math.PI * 2);
    paint(ctx, INK);
    ctx.beginPath();
    ctx.ellipse(side * 44, -20, 4, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fffaf3";
    ctx.fill();
  }
  ctx.restore();
  enter(ctx, face, face.mouth);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(0, -8, 42, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}

function drawFox(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 18, 8);
    ctx.lineTo(side * 78, 4);
    ctx.lineTo(side * 40, -86);
    ctx.closePath();
    paint(ctx, "#dd7a32");
    ctx.beginPath();
    ctx.moveTo(side * 28, 2);
    ctx.lineTo(side * 58, 0);
    ctx.lineTo(side * 40, -52);
    ctx.closePath();
    paint(ctx, "#f3e6d4", INK, 4);
  }
  ctx.restore();
  enter(ctx, face, face.nose);
  ctx.beginPath();
  ctx.ellipse(0, 18, 46, 28, 0, 0, Math.PI * 2);
  paint(ctx, "#fffaf3", INK, 5);
  ctx.beginPath();
  ctx.ellipse(0, 4, 14, 11, 0, 0, Math.PI * 2);
  paint(ctx, "#2a211c");
  ctx.restore();
}

function drawUnicorn(ctx: CanvasRenderingContext2D, face: FaceFrame, time: number) {
  enter(ctx, face, face.forehead);
  sparkles(ctx, time, 6);
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.lineTo(16, 8);
  ctx.lineTo(0, -118);
  ctx.closePath();
  const horn = ctx.createLinearGradient(0, 8, 0, -118);
  horn.addColorStop(0, "#fffaf3");
  horn.addColorStop(0.5, "#e7d7a8");
  horn.addColorStop(1, "#c44536");
  paint(ctx, "#f4e4c4");
  ctx.strokeStyle = "#c44536";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.quadraticCurveTo(12, -28, -6, -48);
  ctx.quadraticCurveTo(10, -68, -4, -88);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 12, 10);
    ctx.quadraticCurveTo(side * 70, -20, side * 40, -70);
    ctx.quadraticCurveTo(side * 18, -10, side * 12, 10);
    paint(ctx, side < 0 ? "#c44536" : "#3d5340", INK, 4);
  }
  ctx.restore();
}

function drawBanana(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  ctx.beginPath();
  ctx.moveTo(-96, 8);
  ctx.quadraticCurveTo(-10, -92, 102, -8);
  ctx.quadraticCurveTo(20, -38, -88, 22);
  ctx.closePath();
  paint(ctx, "#f2d14b");
  ctx.beginPath();
  ctx.moveTo(-86, 6);
  ctx.quadraticCurveTo(-6, -70, 88, -6);
  ctx.strokeStyle = "rgba(42,33,28,0.18)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-92, 10, 14, 10, -0.4, 0, Math.PI * 2);
  paint(ctx, "#6faf5a");
  ctx.beginPath();
  ctx.ellipse(100, -8, 12, 9, 0.5, 0, Math.PI * 2);
  paint(ctx, "#c9a227");
  ctx.restore();
}

function drawStrawberry(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.7, -48);
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.bezierCurveTo(78, 40, 70, -20, 18, -28);
  ctx.lineTo(0, -8);
  ctx.lineTo(-18, -28);
  ctx.bezierCurveTo(-70, -20, -78, 40, 0, 70);
  ctx.closePath();
  paint(ctx, "#c44536");
  for (let i = 0; i < 9; i += 1) {
    const col = (i % 3) - 1;
    const row = Math.floor(i / 3);
    ctx.beginPath();
    ctx.ellipse(col * 18, 6 + row * 16, 3.2, 5, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "#f2d14b";
    ctx.fill();
  }
  for (const side of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 18, -32, 16, 10, side * 0.4, 0, Math.PI * 2);
    paint(ctx, "#3d5340", INK, 4);
  }
  ctx.restore();
  enter(ctx, face, face.nose);
  ctx.fillStyle = "rgba(196, 69, 54, 0.28)";
  ctx.beginPath();
  ctx.ellipse(-52, 18, 16, 10, 0, 0, Math.PI * 2);
  ctx.ellipse(52, 18, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWatermelon(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.72, -6);
  ctx.beginPath();
  ctx.arc(0, 12, 92, Math.PI, 0);
  ctx.closePath();
  paint(ctx, "#3d5340");
  ctx.beginPath();
  ctx.arc(0, 12, 78, Math.PI, 0);
  ctx.closePath();
  paint(ctx, "#fffaf3", INK, 4);
  ctx.beginPath();
  ctx.arc(0, 12, 66, Math.PI, 0);
  ctx.closePath();
  paint(ctx, "#c44536", INK, 4);
  for (const x of [-36, -12, 12, 36]) {
    ctx.beginPath();
    ctx.ellipse(x, -18, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  }
  ctx.restore();
}

function drawAvocado(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.7, -10);
  ctx.beginPath();
  ctx.ellipse(0, -8, 58, 78, 0, 0, Math.PI * 2);
  paint(ctx, "#3d5340");
  ctx.beginPath();
  ctx.ellipse(0, -4, 40, 58, 0, 0, Math.PI * 2);
  paint(ctx, "#c8d36a", INK, 4);
  ctx.beginPath();
  ctx.ellipse(0, 6, 18, 16, 0, 0, Math.PI * 2);
  paint(ctx, "#8a5a32");
  ctx.beginPath();
  ctx.ellipse(5, 1, 5, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,250,243,0.4)";
  ctx.fill();
  ctx.restore();
}

function drawCarrot(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  ctx.beginPath();
  ctx.moveTo(-28, 16);
  ctx.lineTo(28, 16);
  ctx.lineTo(0, -128);
  ctx.closePath();
  paint(ctx, "#e07a32");
  ctx.strokeStyle = "rgba(42,33,28,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, -20);
  ctx.lineTo(6, -48);
  ctx.moveTo(-6, -70);
  ctx.lineTo(8, -92);
  ctx.stroke();
  for (const side of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.quadraticCurveTo(side * 28, -150, side * 8, -168);
    ctx.quadraticCurveTo(side * 10, -130, 0, -118);
    paint(ctx, "#3d5340", INK, 4);
  }
  ctx.restore();
}

function drawBroccoli(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.forehead);
  ctx.beginPath();
  ctx.moveTo(-12, 16);
  ctx.lineTo(12, 16);
  ctx.lineTo(8, -36);
  ctx.lineTo(-8, -36);
  ctx.closePath();
  paint(ctx, "#6f8f48");
  const bumps = [
    [0, -70, 36],
    [-32, -52, 28],
    [34, -50, 30],
    [-18, -88, 24],
    [20, -90, 26],
    [0, -108, 20],
  ] as const;
  for (const [x, y, r] of bumps) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    paint(ctx, "#3d5340", INK, 4);
  }
  ctx.restore();
}

function drawTomato(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.72, -8);
  ctx.beginPath();
  ctx.ellipse(0, -6, 62, 54, 0, 0, Math.PI * 2);
  paint(ctx, "#c44536");
  ctx.beginPath();
  ctx.ellipse(-12, -22, 10, 6, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,250,243,0.28)";
  ctx.fill();
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 16, -52 + Math.sin(a) * 8, 12, 7, a, 0, Math.PI * 2);
    paint(ctx, "#3d5340", INK, 4);
  }
  ctx.beginPath();
  ctx.rect(-3, -70, 6, 16);
  paint(ctx, "#2f7d4a", INK, 3);
  ctx.restore();
}

function drawPizza(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.58, -8);
  ctx.beginPath();
  ctx.moveTo(0, -128);
  ctx.lineTo(70, 18);
  ctx.quadraticCurveTo(0, 36, -70, 18);
  ctx.closePath();
  paint(ctx, "#e2b15a");
  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(54, 8);
  ctx.quadraticCurveTo(0, 20, -54, 8);
  ctx.closePath();
  paint(ctx, "#f0d37a", INK, 4);
  for (const [x, y] of [
    [-16, -48],
    [18, -28],
    [-8, -8],
    [10, -64],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 12, 0.3, 0, Math.PI * 2);
    paint(ctx, "#c44536", INK, 4);
  }
  ctx.beginPath();
  ctx.ellipse(-28, -24, 8, 5, 0.8, 0, Math.PI * 2);
  paint(ctx, "#3d5340", INK, 3);
  ctx.restore();
}

function drawTaco(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.82, -28);
  ctx.beginPath();
  ctx.ellipse(0, -8, 92, 52, 0, Math.PI, 0);
  ctx.ellipse(0, -8, 92, 18, 0, 0, Math.PI);
  paint(ctx, "#e2b15a");
  ctx.beginPath();
  ctx.ellipse(0, -18, 70, 28, 0, Math.PI, Math.PI * 2);
  paint(ctx, "#c44536", INK, 4);
  ctx.beginPath();
  ctx.ellipse(-18, -28, 22, 10, -0.4, 0, Math.PI * 2);
  paint(ctx, "#3d5340", INK, 3);
  ctx.beginPath();
  ctx.ellipse(22, -24, 18, 8, 0.3, 0, Math.PI * 2);
  paint(ctx, "#f0d37a", INK, 3);
  ctx.restore();
}

function drawIceCream(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enterHat(ctx, face, 0.8, -12);
  ctx.beginPath();
  ctx.moveTo(-24, -64);
  ctx.lineTo(24, -64);
  ctx.lineTo(0, -150);
  ctx.closePath();
  paint(ctx, "#e2b15a");
  ctx.strokeStyle = "rgba(42,33,28,0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-12, -76);
  ctx.lineTo(-4, -120);
  ctx.moveTo(12, -76);
  ctx.lineTo(4, -120);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -20, 36, 0, Math.PI * 2);
  paint(ctx, "#e07a86");
  ctx.beginPath();
  ctx.arc(0, -52, 32, 0, Math.PI * 2);
  paint(ctx, "#fffaf3");
  ctx.beginPath();
  ctx.arc(0, -82, 10, 0, Math.PI * 2);
  paint(ctx, "#c44536");
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.quadraticCurveTo(14, -108, 8, -118);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function drawDonut(ctx: CanvasRenderingContext2D, face: FaceFrame) {
  enter(ctx, face, face.nose);
  ctx.beginPath();
  ctx.arc(0, 4, 128, 0, Math.PI * 2);
  ctx.arc(0, 4, 82, 0, Math.PI * 2, true);
  paint(ctx, "#e2b15a");
  ctx.beginPath();
  ctx.arc(0, 4, 120, 0, Math.PI * 2);
  ctx.arc(0, 4, 88, 0, Math.PI * 2, true);
  paint(ctx, "#c44536", INK, 5);
  const colors = ["#fffaf3", "#f2d14b", "#3d5340", "#1a1714"];
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2 + 0.2;
    const r = 104;
    ctx.save();
    ctx.translate(Math.cos(a) * r, 4 + Math.sin(a) * r);
    ctx.rotate(a);
    ctx.fillStyle = colors[i % colors.length]!;
    ctx.fillRect(-5, -1.5, 10, 3);
    ctx.restore();
  }
  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, face: FaceFrame, time: number) {
  enter(ctx, face, face.forehead);
  const flowers: Array<[number, number, string, number]> = [
    [-78, 8, "#c44536", 16],
    [-48, -10, "#fffaf3", 14],
    [-18, 4, "#e07a86", 15],
    [16, -12, "#f2d14b", 16],
    [48, 6, "#fffaf3", 14],
    [78, -6, "#c44536", 15],
    [0, -28, "#e07a86", 13],
  ];
  ctx.strokeStyle = "#3d5340";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-88, 12);
  ctx.quadraticCurveTo(0, -8, 88, 12);
  ctx.stroke();
  for (const [x, y, color, r] of flowers) {
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + time * 0.15;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.38, r * 0.22, a, 0, Math.PI * 2);
      paint(ctx, color, INK, 3);
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
    paint(ctx, "#f2d14b", INK, 3);
  }
  ctx.restore();
}

const OVERLAYS: Record<
  OverlayId,
  (ctx: CanvasRenderingContext2D, face: FaceFrame, time: number) => void
> = {
  none: () => undefined,
  kitty: (ctx, face) => drawKitty(ctx, face),
  puppy: (ctx, face) => drawPuppy(ctx, face),
  bunny: (ctx, face) => drawBunny(ctx, face),
  frog: (ctx, face) => drawFrog(ctx, face),
  fox: (ctx, face) => drawFox(ctx, face),
  unicorn: (ctx, face, time) => drawUnicorn(ctx, face, time),
  banana: (ctx, face) => drawBanana(ctx, face),
  strawberry: (ctx, face) => drawStrawberry(ctx, face),
  watermelon: (ctx, face) => drawWatermelon(ctx, face),
  avocado: (ctx, face) => drawAvocado(ctx, face),
  carrot: (ctx, face) => drawCarrot(ctx, face),
  broccoli: (ctx, face) => drawBroccoli(ctx, face),
  tomato: (ctx, face) => drawTomato(ctx, face),
  pizza: (ctx, face) => drawPizza(ctx, face),
  taco: (ctx, face) => drawTaco(ctx, face),
  icecream: (ctx, face) => drawIceCream(ctx, face),
  donut: (ctx, face) => drawDonut(ctx, face),
  crown: (ctx, face, time) => drawCrown(ctx, face, time),
};

export function drawFilterOverlay(
  ctx: CanvasRenderingContext2D,
  face: FaceFrame,
  overlay: OverlayId,
  time: number,
) {
  OVERLAYS[overlay](ctx, face, time);
}

export function drawGlowDust(ctx: CanvasRenderingContext2D, face: FaceFrame, time: number) {
  enter(ctx, face, face.nose);
  sparkles(ctx, time, 5);
  ctx.restore();
}
