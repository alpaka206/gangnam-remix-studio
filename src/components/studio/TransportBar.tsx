"use client";

import { Download, Pause, Play, Save, Square, Timer, Zap } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatTime } from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";
import type { PlaybackSpeed } from "@/types/studio";

type TransportBarProps = {
  onTogglePlayback: () => void;
  onStopPlayback: () => void;
  onExportMix: () => void;
};

const speedOptions: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

export function TransportBar({
  onTogglePlayback,
  onStopPlayback,
  onExportMix,
}: TransportBarProps) {
  const bpm = useStudioStore((state) => state.bpm);
  const speed = useStudioStore((state) => state.speed);
  const snapToBeat = useStudioStore((state) => state.snapToBeat);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const playheadTime = useStudioStore((state) => state.playheadTime);
  const exportStatus = useStudioStore((state) => state.exportStatus);
  const exportError = useStudioStore((state) => state.exportError);
  const lastSavedAt = useStudioStore((state) => state.lastSavedAt);
  const setBpm = useStudioStore((state) => state.setBpm);
  const setSpeed = useStudioStore((state) => state.setSpeed);
  const setSnapToBeat = useStudioStore((state) => state.setSnapToBeat);
  const saveProject = useStudioStore((state) => state.saveProject);
  const exportLabel =
    exportStatus === "rendering"
      ? "Rendering..."
      : exportStatus === "ready"
        ? "Exported"
        : "Export Mix";

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-100">
      <div className="flex items-center gap-2">
        <Button
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={onTogglePlayback}
          variant="primary"
          icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          aria-label="Stop"
          onClick={onStopPlayback}
          icon={<Square size={15} />}
        >
          Stop
        </Button>
        <div className="ml-2 flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 font-mono text-sm text-zinc-100">
          <Timer size={15} className="text-zinc-400" />
          <span data-testid="current-time">{formatTime(playheadTime)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <span>BPM</span>
          <input
            aria-label="BPM"
            className="h-9 w-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-300"
            min={60}
            max={220}
            type="number"
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <span>Speed</span>
          <select
            aria-label="Speed"
            className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-300"
            value={speed}
            onChange={(event) =>
              setSpeed(Number(event.target.value) as PlaybackSpeed)
            }
          >
            {speedOptions.map((option) => (
              <option key={option} value={option}>
                {option}x
              </option>
            ))}
          </select>
        </label>

        <label className="flex h-9 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-200">
          <input
            aria-label="Snap to beat"
            checked={snapToBeat}
            className="h-4 w-4 accent-amber-300"
            type="checkbox"
            onChange={(event) => setSnapToBeat(event.target.checked)}
          />
          Snap to beat
        </label>
      </div>

      <div className="flex items-center gap-2">
        {lastSavedAt ? (
          <span className="hidden font-mono text-xs text-zinc-500 xl:inline">
            Saved {new Date(lastSavedAt).toLocaleTimeString()}
          </span>
        ) : null}
        {exportStatus !== "idle" ? (
          <span
            className={`font-mono text-xs ${
              exportStatus === "error" ? "text-rose-300" : "text-amber-200"
            }`}
            data-testid="export-status"
            title={exportError ?? undefined}
          >
            {exportStatus === "rendering"
              ? "rendering wav"
              : exportStatus === "ready"
                ? "export ready"
                : "export failed"}
          </span>
        ) : null}
        <Button onClick={saveProject} icon={<Save size={15} />}>
          Save
        </Button>
        <Button
          onClick={onExportMix}
          variant="primary"
          disabled={exportStatus === "rendering"}
          icon={
            exportStatus === "rendering" ? (
              <Zap size={15} />
            ) : (
              <Download size={15} />
            )
          }
        >
          {exportLabel}
        </Button>
      </div>
    </header>
  );
}
