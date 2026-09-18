import { useCallback, useEffect, useState } from "react";
import {
  addShot,
  loadGallery,
  removeShot,
  type Shot,
} from "@/lib/gallery";

export function useGallery() {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    setShots(loadGallery());
  }, []);

  const push = useCallback((shot: Shot) => {
    setShots((current) => addShot(current, shot));
  }, []);

  const remove = useCallback((id: string) => {
    setShots((current) => removeShot(current, id));
  }, []);

  return { shots, push, remove };
}
