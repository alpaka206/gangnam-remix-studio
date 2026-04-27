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
import { formatTime } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";

export function TrackList() {
  const [error, setError] = useState<string | null>(null);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const samples = useStudioStore((state) => state.samples);
  const selectedSampleId = useStudioStore((state) => state.selectedSampleId);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);
  const selectSample = useStudioStore((state) => state.selectSample);
  const addSampleClip = useStudioStore((state) => state.addSampleClip);

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

      <div className="border-b border-zinc-800 px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Meme Sounds
          </p>
          <p className="font-mono text-[11px] text-zinc-600">click to add</p>
        </div>
        <div className="space-y-1">
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md border px-2 py-2 text-left text-sm transition",
                selectedSampleId === sample.id
                  ? "border-amber-300 bg-amber-300/10 text-amber-100"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600",
              )}
              data-testid="left-audio-source"
              aria-label={`Add ${sample.name} from left sources`}
              onClick={() => {
                selectSample(sample.id);
                addSampleClip(sample.id);
              }}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {sample.fileName ?? sample.name}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">
                  {sample.duration > 0 ? formatTime(sample.duration) : "audio"}
                </span>
              </span>
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: sample.color }}
              />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
