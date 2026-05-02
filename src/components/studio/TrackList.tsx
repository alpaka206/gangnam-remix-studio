"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { MAIN_AUDIO_ASSET_ID, registerAudioAsset } from "@/lib/audio/assets";
import {
  createAudioObjectUrl,
  getAudioDuration,
  isSupportedAudioFile,
} from "@/lib/audio/files";
import { savePersistentAudioAsset } from "@/lib/audio/persistentAssets";
import { cn } from "@/lib/cn";
import { setSampleDragData } from "@/lib/timeline/drag";
import { formatTime } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";

type TrackListProps = {
  onTriggerSample: (sampleId: string) => void;
};

export function TrackList({ onTriggerSample }: TrackListProps) {
  const [error, setError] = useState<string | null>(null);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const samples = useStudioStore((state) => state.samples);
  const selectedSampleId = useStudioStore((state) => state.selectedSampleId);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);

  async function handleMainUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!isSupportedAudioFile(file)) {
      setError("Only mp3, wav, and m4a files are supported.");
      return;
    }

    setError(null);
    const objectUrl = createAudioObjectUrl(file);
    const duration = await getAudioDuration(file);

    registerAudioAsset(MAIN_AUDIO_ASSET_ID, file, objectUrl);
    void savePersistentAudioAsset(MAIN_AUDIO_ASSET_ID, file);
    setMainTrack({
      fileName: file.name,
      objectUrl,
      duration,
      status: "ready",
    });
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase text-zinc-500">Sources</p>
      </div>

      <div className="border-b border-zinc-800 px-3 py-3">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:border-amber-300">
          <Upload size={15} />
          Upload Main
          <input
            data-testid="main-upload"
            aria-label="Upload main music"
            className="sr-only"
            type="file"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
            onChange={(event) => handleMainUpload(event.target.files?.[0])}
          />
        </label>
        <div className="mt-2 min-h-12 rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2">
          <p className="truncate text-sm text-zinc-200">
            {mainTrack.fileName ?? "No main music loaded"}
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {mainTrack.duration > 0
              ? formatTime(mainTrack.duration)
              : mainTrack.status === "stale"
                ? "restoring audio"
                : "mp3 / wav / m4a"}
          </p>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden border-b border-zinc-800 px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Meme Sounds
          </p>
          <p className="font-mono text-[11px] text-zinc-600">click / drag</p>
        </div>
        <div className="studio-scrollbar h-[calc(100%-1.5rem)] space-y-1 overflow-y-auto pr-1">
          {samples.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-3 text-sm text-zinc-500">
              Upload a sound below to place it here.
            </div>
          ) : null}
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className={cn(
                "flex w-full select-none items-center justify-between gap-2 rounded-md border px-2 py-2 text-left text-sm transition",
                selectedSampleId === sample.id
                  ? "border-amber-300 bg-amber-300/10 text-amber-100"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600",
              )}
              data-testid="left-audio-source"
              aria-label={`Add ${getSampleLabel(sample)} from left sources`}
              draggable
              onDragStart={(event) =>
                setSampleDragData(event.dataTransfer, sample.id)
              }
              onClick={() => onTriggerSample(sample.id)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {getSampleLabel(sample)}
                </span>
              </span>
              <span
                className="flex shrink-0 items-center gap-2"
                aria-hidden="true"
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: sample.color }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function getSampleLabel(sample: { name: string; fileName?: string }) {
  return sample.name || "Sound";
}
