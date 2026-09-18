import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { drawBuddy } from "@/lib/draw-buddy";
import { drawFilterOverlay, drawGlowDust, LOOK_FILTER } from "@/lib/draw-filters";
import { faceFromLandmarks, fallbackFace, smoothFace, type FaceFrame } from "@/lib/face";
import type { FilterDef } from "@/lib/filters";
import type { CameraStatus, Facing } from "@/hooks/use-camera";
import { useLandmarker } from "@/hooks/use-landmarker";

export type SourceMode = "studio" | "camera";

type Props = {
  source: SourceMode;
  status: CameraStatus;
  facing: Facing;
  filter: FilterDef;
  countdown: number | null;
  flash: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onStayInStudio: () => void;
  children?: ReactNode;
};

export function CameraStage({
  source,
  status,
  facing,
  filter,
  countdown,
  flash,
  videoRef,
  canvasRef,
  onStayInStudio,
  children,
}: Props) {
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const facingRef = useRef(facing);
  facingRef.current = facing;
  const live = status.kind === "live";
  const { detect, ready, failed } = useLandmarker(live);
  const detectRef = useRef(detect);
  detectRef.current = detect;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const smoothRef = useRef<FaceFrame | null>(null);
  const missRef = useRef(0);
  const faceHintRef = useRef<HTMLParagraphElement | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    smoothRef.current = null;
    missRef.current = 0;
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let running = true;

    const tick = () => {
      if (!running) return;
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
      const tw = Math.max(2, Math.round(box.width * dpr));
      const th = Math.max(2, Math.round(box.height * dpr));
      if (tw >= 8 && th >= 8 && (canvas.width !== tw || canvas.height !== th)) {
        canvas.width = tw;
        canvas.height = th;
      }

      const currentFilter = filterRef.current;
      const look = LOOK_FILTER[currentFilter.look];
      const time = performance.now() / 1000;
      const video = videoRef.current;
      const usingCamera =
        sourceRef.current === "camera" &&
        video !== null &&
        video.readyState >= 2 &&
        video.videoWidth > 0;

      if (usingCamera && video) {
        const mirror = facingRef.current === "user";
        ctx.save();
        if (mirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.filter = look;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        ctx.filter = "none";

        let detected: FaceFrame | null = null;
        if (readyRef.current) {
          const result = detectRef.current(video);
          const lms = result?.faceLandmarks[0];
          if (lms) detected = faceFromLandmarks(lms, canvas.width, canvas.height, mirror);
        }
        if (detected) {
          missRef.current = 0;
          smoothRef.current = smoothFace(smoothRef.current, detected);
        } else {
          missRef.current += 1;
          if (missRef.current > 12) smoothRef.current = null;
        }
        const face =
          smoothRef.current ?? (detected ? detected : fallbackFace(canvas.width, canvas.height));
        drawFilterOverlay(ctx, face, currentFilter.overlay, time);
        if (currentFilter.look === "glow" && currentFilter.overlay === "none") {
          drawGlowDust(ctx, face, time);
        }
        if (faceHintRef.current) {
          const showHint = !detected && missRef.current > 18 && readyRef.current;
          faceHintRef.current.dataset.show = showHint ? "1" : "0";
        }
      } else if (canvas.width >= 8 && canvas.height >= 8) {
        ctx.filter = look;
        const face = drawBuddy(ctx, canvas.width, canvas.height, time, reducedRef.current);
        ctx.filter = "none";
        drawFilterOverlay(ctx, face, currentFilter.overlay, time);
        if (currentFilter.look === "glow" && currentFilter.overlay === "none") {
          drawGlowDust(ctx, face, time);
        }
        if (faceHintRef.current) faceHintRef.current.dataset.show = "0";
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, videoRef]);

  const banner = stageBanner(source, status, failed);

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-[1.25rem] bg-bg-warm shadow-[var(--shadow-booth)]">
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0"
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        aria-label="Live photo booth preview"
      />

      <p
        ref={faceHintRef}
        data-show="0"
        className="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-full bg-ink/70 px-3 py-1.5 text-center text-xs font-medium text-primary-fg opacity-0 transition-opacity duration-200 data-[show='1']:opacity-100"
      >
        Face not found — step closer and find the light
      </p>

      {banner ? (
        <div className="absolute inset-x-3 top-3 z-20 rounded-2xl bg-surface/95 p-3 text-center shadow-[0_0_0_1px_rgb(26_23_20/0.08)]">
          <p className="font-display text-base font-semibold tracking-tight text-ink">{banner.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{banner.body}</p>
          {banner.action === "blocked" ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-danger">
              <CameraOff className="size-3.5" />
              Permission is blocked in this browser
            </p>
          ) : null}
          <Button className="mt-3" variant="outline" size="sm" onClick={onStayInStudio}>
            Keep using studio
          </Button>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg/90 to-transparent px-2 pb-3 pt-10">
        {children}
      </div>

      {countdown !== null && countdown > 0 ? (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-ink/25">
          <span
            key={countdown}
            className="font-display text-7xl font-semibold leading-none tracking-tight text-primary-fg motion-ok sm:text-8xl"
            style={{ animation: "count-pop 900ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
          >
            {countdown}
          </span>
        </div>
      ) : null}

      {flash ? (
        <div
          className="pointer-events-none absolute inset-0 z-40 bg-surface"
          style={{ animation: "booth-flash 180ms ease-out both" }}
        />
      ) : null}
    </div>
  );
}

function stageBanner(
  source: SourceMode,
  status: CameraStatus,
  trackerFailed: boolean,
): { title: string; body: string; action?: "blocked" } | null {
  if (source === "camera" && status.kind === "live") {
    if (trackerFailed) {
      return {
        title: "Filters are on",
        body: "Face tracking could not load, so hats sit in the center.",
      };
    }
    return null;
  }
  if (status.kind === "requesting") {
    return {
      title: "Waiting for camera",
      body: "Allow the camera prompt, or stay in studio.",
    };
  }
  if (status.kind === "denied") {
    return {
      title: "Camera is blocked",
      body: "Studio still works. Allow camera in the browser if you want a live snap.",
      action: "blocked",
    };
  }
  if (status.kind === "missing") {
    return {
      title: "No camera found",
      body: "Studio mode is ready with every filter.",
    };
  }
  if (status.kind === "error") {
    return {
      title: "Camera hiccup",
      body: status.message || "Something went wrong opening the camera.",
    };
  }
  return null;
}

