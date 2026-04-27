"use client";

import { Music, Upload } from "lucide-react";
import { useState } from "react";

import { trackDefinitions } from "@/data/mockSamples";
import {
  createAudioObjectUrl,
  getAudioDuration,
  isSupportedAudioFile,
} from "@/lib/audio/files";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";

export function TrackList() {
  const [error, setError] = useState<string | null>(null);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);

  async function handleMainUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!isSupportedAudioFile(file)) {
      setError("mp3, wav, m4a 파일만 지원합니다.");
      return;
    }

    if (mainTrack.objectUrl) {
      URL.revokeObjectURL(mainTrack.objectUrl);
    }

    setError(null);
    const objectUrl = createAudioObjectUrl(file);
    const duration = await getAudioDuration(file);

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
        <p className="text-xs font-semibold uppercase text-zinc-500">Tracks</p>
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
                ? "reload required"
                : "mp3 / wav / m4a"}
          </p>
        </div>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {trackDefinitions.map((track) => (
          <div
            key={track.id}
            className={cn(
              "mx-2 mb-1 flex h-12 items-center gap-3 rounded-md border border-transparent px-3 text-sm text-zinc-200",
              track.id === "main" ? "bg-zinc-900" : "bg-zinc-950",
            )}
          >
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: track.color }}
            />
            <Music size={15} className="text-zinc-500" />
            <span>{track.name}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
