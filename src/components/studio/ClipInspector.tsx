"use client";

import { Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatBarsBeats } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";

export function ClipInspector() {
  const bpm = useStudioStore((state) => state.bpm);
  const selectedClipId = useStudioStore((state) => state.selectedClipId);
  const clip = useStudioStore((state) =>
    state.clips.find((item) => item.id === selectedClipId),
  );
  const updateClip = useStudioStore((state) => state.updateClip);
  const deleteClip = useStudioStore((state) => state.deleteClip);

  return (
    <aside
      className="flex h-full min-h-0 flex-col border-l border-zinc-800 bg-zinc-950"
      data-testid="clip-inspector"
    >
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Inspector
        </p>
      </div>

      {clip ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          <div>
            <p className="text-xs text-zinc-500">Clip Name</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-zinc-50">
              {clip.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              Meme sound / {formatBarsBeats(clip.start, bpm)}
            </p>
          </div>

          <label className="block text-sm text-zinc-300">
            Start Time
            <input
              aria-label="Start time"
              className="mt-1 h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-300"
              min={0}
              step={0.01}
              type="number"
              value={clip.start}
              onChange={(event) =>
                updateClip(clip.id, { start: Number(event.target.value) })
              }
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Length
            <input
              aria-label="Clip length"
              className="mt-1 h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-300"
              min={0.1}
              step={0.01}
              type="number"
              value={clip.duration}
              onChange={(event) =>
                updateClip(clip.id, { duration: Number(event.target.value) })
              }
            />
          </label>

          <label className="block text-sm text-zinc-300">
            <span className="flex items-center gap-2">
              <Volume2 size={15} />
              Volume
            </span>
            <input
              aria-label="Clip volume"
              className="mt-2 w-full accent-amber-300"
              max={1}
              min={0}
              step={0.01}
              type="range"
              value={clip.volume}
              onChange={(event) =>
                updateClip(clip.id, { volume: Number(event.target.value) })
              }
            />
            <span className="font-mono text-xs text-zinc-500">
              {Math.round(clip.volume * 100)}%
            </span>
          </label>

          <label className="flex h-10 items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200">
            Loop
            <input
              aria-label="Loop clip"
              checked={clip.loop}
              className="h-4 w-4 accent-amber-300"
              type="checkbox"
              onChange={(event) =>
                updateClip(clip.id, { loop: event.target.checked })
              }
            />
          </label>

          <Button
            className="w-full"
            data-testid="delete-clip"
            variant="danger"
            icon={<Trash2 size={15} />}
            onClick={() => deleteClip(clip.id)}
          >
            Delete Clip
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-zinc-500">
          Select a clip to inspect timing, volume, loop, and deletion controls.
        </div>
      )}
    </aside>
  );
}
