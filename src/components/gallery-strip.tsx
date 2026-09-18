import { formatShotDate, type Shot } from "@/lib/gallery";
import { cn } from "@/lib/utils";

type Props = {
  shots: Shot[];
  onOpen: (shot: Shot) => void;
};

export function GalleryStrip({ shots, onOpen }: Props) {
  if (shots.length === 0) return null;

  return (
    <div className="px-3 pb-2">
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {shots.map((shot, i) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => onOpen(shot)}
            className={cn(
              "h-14 w-11 shrink-0 overflow-hidden rounded-md bg-surface shadow-[0_0_0_1px_rgb(26_23_20/0.08)]",
              i % 2 === 0 ? "rotate-1" : "-rotate-1",
            )}
            aria-label={`${shot.filterName} snap from ${formatShotDate(shot.createdAt)}`}
          >
            <img src={shot.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
