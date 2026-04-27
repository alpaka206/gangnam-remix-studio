"use client";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";

import {
  createUploadedSampleInputs,
  findUnsupportedAudioFile,
} from "@/lib/audio/importSamples";
import { setSampleDragData } from "@/lib/timeline/drag";
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

    const invalidFile = findUnsupportedAudioFile(files);

    if (invalidFile) {
      setError(`${invalidFile.name} is not a supported audio file.`);
      return;
    }

    setError(null);
    addUploadedSamples(await createUploadedSampleInputs(files));
  }

  return (
    <section
      className="border-t border-zinc-800 bg-zinc-950"
      data-testid="sample-library"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Meme Sound Library
          </p>
          <p className="text-xs text-zinc-500">
            Click + to place at the playhead, or drag a sound onto the timeline.
          </p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 transition hover:border-amber-300">
          <Upload size={15} />
          Upload Meme Sound
          <input
            data-testid="meme-upload"
            aria-label="Upload meme sounds"
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
            No sounds loaded. Upload a meme sound to add it to the timeline.
          </div>
        ) : null}
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            className={`flex min-w-44 select-none flex-col rounded-md border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-300/40 ${
              selectedSampleId === sample.id
                ? "border-amber-300 bg-amber-300/10"
                : "border-zinc-800 bg-zinc-900 hover:border-amber-300"
            }`}
            data-testid="sample-item"
            aria-label={`Add ${sample.name} to timeline`}
            draggable
            onDragStart={(event) =>
              setSampleDragData(event.dataTransfer, sample.id)
            }
            onClick={() => {
              selectSample(sample.id);
              addSampleClip(sample.id);
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="truncate text-sm font-semibold text-zinc-100">
                {sample.name}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] uppercase text-amber-200">
                <Plus size={14} />
                Add
              </span>
            </span>
            <span className="mt-3 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: sample.color }}
              />
              <span className="font-mono text-xs text-zinc-500">
                Meme sound / {formatTime(sample.duration)}
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
