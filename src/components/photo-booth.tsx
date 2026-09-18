import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, SwitchCamera, VideoOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import { CameraStage, type SourceMode } from "@/components/camera-stage";
import { FilterRail } from "@/components/filter-rail";
import { GalleryStrip } from "@/components/gallery-strip";
import { ShotDialog } from "@/components/shot-dialog";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useGallery } from "@/hooks/use-gallery";
import { DEFAULT_FILTER, FILTER_BY_ID, type FilterCategory, type FilterDef } from "@/lib/filters";
import {
  canvasToJpeg,
  composePolaroid,
  downloadDataUrl,
  formatShotDate,
  scaleCanvas,
  type Shot,
} from "@/lib/gallery";
import { playShutter } from "@/lib/shutter-sound";
import { cn } from "@/lib/utils";

export function PhotoBooth() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { videoRef, status, start, flip, hangUp, facing, canFlip } = useCamera();
  const { shots, push, remove } = useGallery();
  const [source, setSource] = useState<SourceMode>("studio");
  const [filter, setFilter] = useState<FilterDef>(DEFAULT_FILTER);
  const [category, setCategory] = useState<FilterCategory | "all">("all");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [activeShot, setActiveShot] = useState<Shot | null>(null);
  const busy = countdown !== null;
  const live = source === "camera" && status.kind === "live";

  const requestCamera = useCallback(() => {
    setSource("camera");
    void start("user");
  }, [start]);

  const stayInStudio = useCallback(() => {
    hangUp();
    setSource("studio");
  }, [hangUp]);

  const capture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width < 8) return;
    playShutter();
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    const scaled = scaleCanvas(canvas);
    const src = canvasToJpeg(scaled);
    const shot: Shot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      src,
      filterId: filter.id,
      filterName: filter.name,
      createdAt: Date.now(),
    };
    push(shot);
    setActiveShot(shot);
    toast.success("Saved to this device");
  }, [filter.id, filter.name, push]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      try {
        capture();
      } finally {
        setCountdown(null);
      }
      return;
    }
    const timer = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, capture]);

  const beginSnap = useCallback(() => {
    if (busy) return;
    setCountdown(3);
  }, [busy]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (activeShot || busy) return;
      event.preventDefault();
      beginSnap();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeShot, beginSnap, busy]);

  function handleDelete(id: string) {
    remove(id);
    setActiveShot(null);
    toast("Removed from gallery");
  }

  async function downloadLatest() {
    const shot = activeShot ?? shots[0];
    if (!shot) {
      toast("Snap a photo first");
      return;
    }
    const img = await loadImage(shot.src);
    const polaroid = composePolaroid(img, shot.filterName, formatShotDate(shot.createdAt));
    const stamp = new Date(shot.createdAt).toISOString().slice(0, 10);
    downloadDataUrl(polaroid.toDataURL("image/jpeg", 0.9), `silly-lens-${shot.filterId}-${stamp}.jpg`);
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-bg text-ink">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "!bg-surface !text-ink !border-line !shadow-[var(--shadow-booth)]",
        }}
      />
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-faint">Photo booth</p>
          <h1 className="font-display truncate text-2xl font-semibold leading-none tracking-tight text-ink">
            Silly Lens
          </h1>
        </div>
        <StatusPill source={live ? "camera" : "studio"} status={status} />
      </header>

      <div className="relative min-h-0 flex-1 px-3">
        <CameraStage
          source={live ? "camera" : "studio"}
          status={status}
          facing={facing}
          filter={filter}
          countdown={countdown}
          flash={flash}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onStayInStudio={stayInStudio}
        >
          <FilterRail
            activeId={filter.id}
            category={category}
            onCategory={setCategory}
            onSelect={(next) => setFilter(FILTER_BY_ID[next.id] ?? next)}
          />

          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <div className="flex size-12 items-center justify-center">
              {live && canFlip ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={() => void flip()}
                  aria-label="Flip camera"
                  disabled={busy}
                >
                  <SwitchCamera />
                </Button>
              ) : live ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={stayInStudio}
                  aria-label="Turn off camera"
                  disabled={busy}
                >
                  <VideoOff />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  onClick={requestCamera}
                  aria-label="Turn on camera"
                  disabled={busy}
                >
                  <Camera />
                </Button>
              )}
            </div>

            <button
              type="button"
              onClick={beginSnap}
              disabled={busy}
              aria-label="Snap photo after countdown"
              className={cn(
                "relative size-16 rounded-full bg-primary text-primary-fg shadow-[0_0_0_5px_rgb(196_69_54/0.18)] transition-transform duration-150 ease-out",
                "hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                "active:not-disabled:scale-[0.96] disabled:opacity-50",
              )}
            >
              <span className="absolute inset-[6px] rounded-full border-[3px] border-primary-fg/90" />
              <span className="sr-only">Shutter</span>
            </button>

            <div className="flex size-12 items-center justify-center">
              <Button
                variant="outline"
                size="icon"
                className="size-11"
                onClick={() => void downloadLatest()}
                aria-label="Download last snap"
                disabled={shots.length === 0}
              >
                <Download />
              </Button>
            </div>
          </div>
        </CameraStage>
      </div>

      <GalleryStrip shots={shots} onOpen={setActiveShot} />

      <ShotDialog shot={activeShot} onClose={() => setActiveShot(null)} onDelete={handleDelete} />
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read snap"));
    img.src = src;
  });
}
