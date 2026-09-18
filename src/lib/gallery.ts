const KEY = "silly-lens-gallery-v1";
const MAX_SHOTS = 12;

export type Shot = {
  id: string;
  src: string;
  filterId: string;
  filterName: string;
  createdAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadGallery(): Shot[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Shot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (shot) =>
        shot &&
        typeof shot.id === "string" &&
        typeof shot.src === "string" &&
        typeof shot.filterName === "string",
    );
  } catch {
    return [];
  }
}

function persist(shots: Shot[]): Shot[] {
  if (!canUseStorage()) return shots;
  for (let n = shots.length; n >= 0; n -= 1) {
    const slice = shots.slice(0, n);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(slice));
      return slice;
    } catch {
      /* quota — drop oldest */
    }
  }
  return [];
}

export function addShot(shots: Shot[], shot: Shot): Shot[] {
  return persist([shot, ...shots].slice(0, MAX_SHOTS));
}

export function removeShot(shots: Shot[], id: string): Shot[] {
  return persist(shots.filter((shot) => shot.id !== id));
}

export function scaleCanvas(
  source: HTMLCanvasElement,
  maxEdge = 900,
): HTMLCanvasElement {
  const edge = Math.max(source.width, source.height);
  const scale = edge > maxEdge ? maxEdge / edge : 1;
  if (scale === 1) return source;
  const out = document.createElement("canvas");
  out.width = Math.round(source.width * scale);
  out.height = Math.round(source.height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.86): string {
  return canvas.toDataURL("image/jpeg", quality);
}

export function composePolaroid(
  photo: HTMLImageElement | HTMLCanvasElement,
  caption: string,
  dateLabel: string,
): HTMLCanvasElement {
  const photoW = "width" in photo && !(photo instanceof HTMLImageElement) ? photo.width : photo.width;
  const photoH =
    "height" in photo && !(photo instanceof HTMLImageElement) ? photo.height : photo.height;
  const frame = Math.max(18, Math.round(photoW * 0.055));
  const footer = Math.max(64, Math.round(photoW * 0.16));
  const canvas = document.createElement("canvas");
  canvas.width = photoW + frame * 2;
  canvas.height = photoH + frame + footer;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#fffcf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(photo, frame, frame, photoW, photoH);

  ctx.fillStyle = "#1a1714";
  const titleSize = Math.max(22, Math.round(photoW * 0.048));
  ctx.font = `600 ${titleSize}px Fraunces, Georgia, serif`;
  ctx.textBaseline = "top";
  ctx.fillText(caption, frame, frame + photoH + Math.round(footer * 0.22));

  ctx.fillStyle = "#8a8378";
  const metaSize = Math.max(13, Math.round(photoW * 0.028));
  ctx.font = `500 ${metaSize}px Outfit, system-ui, sans-serif`;
  ctx.fillText(dateLabel, frame, frame + photoH + Math.round(footer * 0.58));

  return canvas;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function formatShotDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toDateString();
  }
}
