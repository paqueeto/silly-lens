import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

type Detector = {
  detectForVideo: FaceLandmarker["detectForVideo"];
};

async function createLandmarker(): Promise<Detector> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const wasmPath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
  const vision = await FilesetResolver.forVisionTasks(wasmPath);

  const make = (delegate: "GPU" | "CPU") =>
    FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/face_landmarker.task",
        delegate,
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.4,
      minFacePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });

  try {
    return await make("GPU");
  } catch {
    return await make("CPU");
  }
}

let shared: Promise<Detector> | null = null;

function getShared(): Promise<Detector> {
  if (!shared) shared = createLandmarker();
  return shared;
}

export function useLandmarker(enabled: boolean) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const detectorRef = useRef<Detector | null>(null);
  const lastTs = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getShared()
      .then((detector) => {
        if (cancelled) return;
        detectorRef.current = detector;
        setReady(true);
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  function detect(video: HTMLVideoElement) {
    const detector = detectorRef.current;
    if (!detector) return null;
    let ts = performance.now();
    if (ts <= lastTs.current) ts = lastTs.current + 1;
    lastTs.current = ts;
    try {
      return detector.detectForVideo(video, ts);
    } catch {
      return null;
    }
  }

  return { ready, failed, detect };
}
