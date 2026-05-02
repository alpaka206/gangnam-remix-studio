"use client";

import { Gauge, Music2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getLaunchpadShortcutForIndex } from "@/data/studioData";
import { setSampleDragData } from "@/lib/timeline/drag";
import { useStudioStore } from "@/store/studioStore";
import type { SampleItem } from "@/types/studio";

type SampleLibraryProps = {
  launchpadPitchSemitones: number;
  launchpadSpeed: number;
  onLaunchpadPitchChange: (pitchSemitones: number) => void;
  onLaunchpadSpeedChange: (speed: number) => void;
  onResetEffects: () => void;
  onTriggerSample: (sampleId: string) => void;
};

export function SampleLibrary({
  launchpadPitchSemitones,
  launchpadSpeed,
  onLaunchpadPitchChange,
  onLaunchpadSpeedChange,
  onResetEffects,
  onTriggerSample,
}: SampleLibraryProps) {
  const samples = useStudioStore((state) => state.samples);
  const selectedSampleId = useStudioStore((state) => state.selectedSampleId);

  return (
    <section
      className="flex h-full min-h-0 flex-col border-t border-zinc-800 bg-zinc-950"
      data-testid="sample-library"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="hidden min-w-32 md:block">
          <p className="text-xs font-semibold uppercase text-zinc-500">
            Launchpad
          </p>
          <p className="text-xs text-zinc-500">Gangnam effect pads</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          <label className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm text-zinc-200">
            <Music2 size={15} className="text-zinc-400" />
            <span className="hidden sm:inline">Pitch</span>
            <input
              aria-label="Launchpad pitch"
              className="w-20 accent-amber-300 sm:w-24"
              max={12}
              min={-12}
              step={1}
              type="range"
              value={launchpadPitchSemitones}
              onChange={(event) =>
                onLaunchpadPitchChange(Number(event.target.value))
              }
            />
            <span className="w-10 text-right font-mono text-xs text-zinc-400">
              {formatPitch(launchpadPitchSemitones)}
            </span>
          </label>

          <label className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-sm text-zinc-200">
            <Gauge size={15} className="text-zinc-400" />
            <span className="hidden sm:inline">Speed</span>
            <input
              aria-label="Launchpad speed"
              className="w-20 accent-amber-300 sm:w-24"
              max={2}
              min={0.5}
              step={0.05}
              type="range"
              value={launchpadSpeed}
              onChange={(event) =>
                onLaunchpadSpeedChange(Number(event.target.value))
              }
            />
            <span className="w-10 text-right font-mono text-xs text-zinc-400">
              {launchpadSpeed.toFixed(2)}x
            </span>
          </label>
          <Button
            aria-label="효과음 초기화"
            className="h-8 px-2"
            icon={<RotateCcw size={15} />}
            onClick={onResetEffects}
          >
            <span className="hidden sm:inline">효과음 초기화</span>
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-4 gap-1.5 px-3 pt-2 pb-0 md:grid-cols-8 md:grid-rows-2 md:gap-2">
        {samples.length === 0 ? (
          <div className="col-span-full flex min-h-24 items-center rounded-md border border-dashed border-zinc-800 bg-zinc-900/40 px-4 text-sm text-zinc-500">
            No sounds loaded.
          </div>
        ) : null}
        {samples.map((sample, index) => {
          const shortcutKey = getLaunchpadShortcutForIndex(index);

          return (
            <button
              key={sample.id}
              type="button"
              className={`relative flex min-h-0 select-none items-center overflow-hidden rounded-md border px-3 py-2 text-left transition active:translate-y-px focus:outline-none focus:ring-2 focus:ring-amber-300/40 ${
                selectedSampleId === sample.id
                  ? "border-amber-300 bg-amber-300/10"
                  : "border-zinc-800 bg-zinc-900 hover:border-amber-300"
              }`}
              data-testid="sample-item"
              aria-label={`Add ${getSampleLabel(sample)} to timeline`}
              draggable
              onDragStart={(event) =>
                setSampleDragData(event.dataTransfer, sample.id)
              }
              onClick={() => onTriggerSample(sample.id)}
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: sample.color }}
              />
              <span className="flex w-full items-center justify-between gap-2 pl-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="block truncate text-[15px] font-semibold text-zinc-100 md:text-base">
                    {getSampleLabel(sample)}
                  </span>
                </span>
                {shortcutKey ? (
                  <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 px-1.5 font-mono text-xs uppercase text-amber-200">
                    {shortcutKey}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getSampleLabel(sample: SampleItem) {
  return sample.name || "Sound";
}

function formatPitch(pitchSemitones: number) {
  if (pitchSemitones === 0) {
    return "0st";
  }

  return `${pitchSemitones > 0 ? "+" : ""}${pitchSemitones}st`;
}
