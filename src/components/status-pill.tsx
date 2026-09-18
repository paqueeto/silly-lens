import { cn } from "@/lib/utils";
import type { CameraStatus } from "@/hooks/use-camera";
import type { SourceMode } from "@/components/camera-stage";

export function statusLabel(source: SourceMode, status: CameraStatus): { label: string; tone: string } {
  if (source === "camera" && status.kind === "live") return { label: "Live", tone: "live" };
  if (status.kind === "requesting") return { label: "Asking", tone: "warn" };
  if (status.kind === "denied") return { label: "Blocked", tone: "danger" };
  if (status.kind === "missing") return { label: "No camera", tone: "muted" };
  if (status.kind === "error") return { label: "Error", tone: "danger" };
  return { label: "Studio", tone: "studio" };
}

export function StatusPill({ source, status }: { source: SourceMode; status: CameraStatus }) {
  const { label, tone } = statusLabel(source, status);
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-2.5 text-xs font-medium shadow-[0_0_0_1px_rgb(26_23_20/0.08)]",
        tone === "live" && "text-live",
        tone === "warn" && "text-warn",
        tone === "danger" && "text-danger",
        tone === "muted" && "text-ink-faint",
        tone === "studio" && "text-moss",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full bg-current", tone === "live" && "motion-ok")}
        style={tone === "live" ? { animation: "live-pulse 1.6s ease-in-out infinite" } : undefined}
      />
      {label}
    </span>
  );
}
