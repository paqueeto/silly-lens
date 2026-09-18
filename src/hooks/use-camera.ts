import { useCallback, useEffect, useRef, useState } from "react";

export type Facing = "user" | "environment";

export type CameraStatus =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "live" }
  | { kind: "denied" }
  | { kind: "missing" }
  | { kind: "error"; message: string };

function isMobileUa(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestId = useRef(0);
  const [status, setStatus] = useState<CameraStatus>({ kind: "idle" });
  const [facing, setFacing] = useState<Facing>("user");
  const [canFlip, setCanFlip] = useState(false);
  const facingRef = useRef<Facing>("user");
  facingRef.current = facing;

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const refreshFlip = useCallback(async (nextFacing: Facing) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      setCanFlip(cams.length > 1 || (isMobileUa() && nextFacing === "user"));
    } catch {
      setCanFlip(isMobileUa());
    }
  }, []);

  const hangUp = useCallback(() => {
    requestId.current += 1;
    stop();
    setStatus({ kind: "idle" });
    setCanFlip(false);
  }, [stop]);

  const start = useCallback(
    async (nextFacing: Facing = facingRef.current) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus({ kind: "missing" });
        return;
      }
      const id = requestId.current + 1;
      requestId.current = id;
      setStatus({ kind: "requesting" });
      stop();

      const watchdog = window.setTimeout(() => {
        if (requestId.current !== id) return;
        stop();
        setStatus({
          kind: "error",
          message: "Camera did not start. Studio still works.",
        });
      }, 8000);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        });
        if (requestId.current !== id) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        setFacing(nextFacing);
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          await video.play().catch(() => undefined);
        }
        if (requestId.current !== id) return;
        await refreshFlip(nextFacing);
        if (requestId.current !== id) return;
        setStatus({ kind: "live" });
      } catch (err) {
        if (requestId.current !== id) return;
        const name = err instanceof DOMException ? err.name : "";
        const message = err instanceof Error ? err.message : "Camera failed";
        if (name === "AbortError") {
          setStatus({ kind: "idle" });
        } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setStatus({ kind: "denied" });
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setStatus({ kind: "missing" });
        } else if (name === "OverconstrainedError" && nextFacing === "environment") {
          await start("user");
        } else {
          setStatus({ kind: "error", message });
        }
      } finally {
        window.clearTimeout(watchdog);
      }
    },
    [refreshFlip, stop],
  );

  const flip = useCallback(async () => {
    const next: Facing = facingRef.current === "user" ? "environment" : "user";
    await start(next);
  }, [start]);

  useEffect(() => () => stop(), [stop]);

  return { videoRef, status, start, flip, hangUp, facing, canFlip };
}
