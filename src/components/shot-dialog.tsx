import * as Dialog from "@radix-ui/react-dialog";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  composePolaroid,
  downloadDataUrl,
  formatShotDate,
  type Shot,
} from "@/lib/gallery";

type Props = {
  shot: Shot | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

export function ShotDialog({ shot, onClose, onDelete }: Props) {
  const open = shot !== null;

  async function handleDownload() {
    if (!shot) return;
    const img = await loadImage(shot.src);
    const polaroid = composePolaroid(img, shot.filterName, formatShotDate(shot.createdAt));
    const stamp = new Date(shot.createdAt).toISOString().slice(0, 10);
    downloadDataUrl(polaroid.toDataURL("image/jpeg", 0.9), `silly-lens-${shot.filterId}-${stamp}.jpg`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed inset-x-3 top-[8vh] z-50 mx-auto max-h-[84dvh] overflow-y-auto max-w-md rounded-[1.75rem] bg-surface p-3 shadow-[var(--shadow-booth)] focus:outline-none sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2">
          <div className="flex items-start justify-between gap-3 px-2 pt-2">
            <div>
              <Dialog.Title className="font-display text-xl font-semibold tracking-tight text-ink">
                {shot?.filterName ?? "Snap"}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-ink-soft">
                {shot ? formatShotDate(shot.createdAt) : ""}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X />
              </Button>
            </Dialog.Close>
          </div>
          {shot ? (
            <div className="mx-auto mt-3 w-[min(100%,18rem)] rotate-1 rounded-md bg-surface p-2.5 pb-8 shadow-[0_0_0_1px_rgb(26_23_20/0.06),0_16px_32px_-20px_rgb(26_23_20/0.4)]">
              <img
                src={shot.src}
                alt={`${shot.filterName} photo`}
                className="aspect-[3/4] w-full rounded-[4px] object-cover outline outline-1 -outline-offset-1 outline-ink/10"
              />
              <p className="mt-3 px-1 font-display text-sm font-medium text-ink">{shot.filterName}</p>
            </div>
          ) : null}
          <div className="mt-4 flex gap-2 px-1 pb-1">
            <Button className="flex-1" onClick={() => void handleDownload()}>
              <Download />
              Download
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (shot) onDelete(shot.id);
              }}
            >
              <Trash2 />
              Remove
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
