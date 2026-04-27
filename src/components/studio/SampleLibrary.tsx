"use client";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";

import { registerAudioAsset } from "@/lib/audio/assets";
import {
  createAudioObjectUrl,
  getAudioDuration,
  isSupportedAudioFile,
} from "@/lib/audio/files";
import { savePersistentAudioAsset } from "@/lib/audio/persistentAssets";
import { createStudioId } from "@/lib/id";
import { formatTime } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";

export function SampleLibrary() {
  const [error, setError] = useState<string | null>(null);
  const samples = useStudioStore((state) => state.samples);
  const selectedSampleId = useStudioStore((state) => state.selectedSampleId);
  const addUploadedSamples = useStudioStore(
    (state) => state.addUploadedSamples,
  );
  const selectSample = useStudioStore((state) => state.selectSample);
  const addSampleClip = useStudioStore((state) => state.addSampleClip);

  async function handleSampleUpload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);

    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find((file) => !isSupportedAudioFile(file));

    if (invalidFile) {
      setError(`${invalidFile.name} is not a supported audio file.`);
      return;
    }

    setError(null);
    const uploadedSamples = await Promise.all(
      files.map(async (file) => {
        const id = createStudioId("uploaded-sample");
        const objectUrl = createAudioObjectUrl(file);

        registerAudioAsset(id, file, objectUrl);
        void savePersistentAudioAsset(id, file);

        return {
          id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          duration: await getAudioDuration(file),
          objectUrl,
        };
      }),
    );

    addUploadedSamples(uploadedSamples);
  }

  return (
    <section
      className="border-t border-zinc-800 bg-zinc-950"
      data-testid="sample-library"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Sample Library
          </p>
          <p className="text-xs text-zinc-500">
            No bundled sample data. Upload SFX or stems when you need extra
            clips.
          </p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 transition hover:border-amber-300">
          <Upload size={15} />
          Upload SFX / Stem
          <input
            data-testid="sfx-upload"
            aria-label="Upload effect sounds"
            className="sr-only"
            multiple
            type="file"
            accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
            onChange={(event) => handleSampleUpload(event.target.files)}
          />
        </label>
      </div>

      {error ? (
        <p className="px-4 pt-3 text-xs text-rose-300">{error}</p>
      ) : null}

      <div className="flex gap-3 overflow-x-auto px-4 py-4">
        {samples.length === 0 ? (
          <div className="flex min-h-24 min-w-72 items-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 px-4 text-sm text-zinc-500">
            Only op.mp3 is loaded. Upload an SFX or stem file to add clips.
          </div>
        ) : null}
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={`flex min-w-44 flex-col rounded-md border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-300/40 ${
              selectedSampleId === sample.id
                ? "border-amber-300 bg-amber-300/10"
                : "border-zinc-800 bg-zinc-900 hover:border-amber-300"
            }`}
            data-testid="sample-item"
            aria-label={`Add ${sample.name} to timeline`}
            onClick={() => {
              selectSample(sample.id);
              addSampleClip(sample.id);
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-zinc-100">
                {sample.name}
              </span>
              <Plus size={15} className="shrink-0 text-amber-200" />
            </span>
            <span className="mt-3 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: sample.color }}
              />
              <span className="font-mono text-xs text-zinc-500">
                {sample.trackId.toUpperCase()} · {formatTime(sample.duration)}
              </span>
            </span>
            <span className="mt-2 text-xs text-zinc-500">
              {sample.fileName}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
