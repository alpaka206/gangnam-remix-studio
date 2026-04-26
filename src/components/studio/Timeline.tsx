"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type PointerEventHandler,
} from "react";

import { MainWaveform } from "@/components/studio/MainWaveform";
import { trackDefinitions } from "@/data/studioData";
import { cn } from "@/lib/cn";
import {
  DEFAULT_PIXELS_PER_SECOND,
  formatBarsBeats,
  getBeatGridLines,
  getTimelineDuration,
  secondsToPixels,
} from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";
import type { StudioClip } from "@/types/studio";

type DragState = {
  clipId: string;
  startClientX: number;
  initialStart: number;
};

export function Timeline() {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const bpm = useStudioStore((state) => state.bpm);
  const clips = useStudioStore((state) => state.clips);
  const selectedClipId = useStudioStore((state) => state.selectedClipId);
  const playheadTime = useStudioStore((state) => state.playheadTime);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const selectClip = useStudioStore((state) => state.selectClip);
  const moveClip = useStudioStore((state) => state.moveClip);

  const timelineDuration = useMemo(
    () =>
      getTimelineDuration(
        clips.map((clip) => clip.start + clip.duration),
        mainTrack.duration,
      ),
    [clips, mainTrack.duration],
  );
  const timelineWidth = secondsToPixels(
    timelineDuration,
    DEFAULT_PIXELS_PER_SECOND,
  );
  const gridLines = useMemo(
    () =>
      getBeatGridLines({
        duration: timelineDuration,
        bpm,
        pixelsPerSecond: DEFAULT_PIXELS_PER_SECOND,
      }),
    [bpm, timelineDuration],
  );
  const rowGridStyle = useMemo<CSSProperties>(() => {
    const beatWidth = secondsToPixels(60 / bpm, DEFAULT_PIXELS_PER_SECOND);
    const barWidth = beatWidth * 4;

    return {
      width: timelineWidth,
      backgroundImage:
        "linear-gradient(to right, rgba(63,63,70,0.7) 1px, transparent 1px), linear-gradient(to right, rgba(113,113,122,0.75) 1px, transparent 1px)",
      backgroundSize: `${beatWidth}px 100%, ${barWidth}px 100%`,
    };
  }, [bpm, timelineWidth]);

  return (
    <section className="relative min-h-0 overflow-hidden bg-[#111315]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
          <div>
            <h1 className="text-sm font-semibold text-zinc-50">
              Gangnam Remix Studio
            </h1>
            <p className="font-mono text-xs text-zinc-500">
              bar.beat {formatBarsBeats(playheadTime, bpm)}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            op.mp3 is the only bundled audio. Uploaded clips and export use the
            same mix engine.
          </p>
        </div>

        <div
          className="min-h-0 flex-1 overflow-auto"
          data-testid="timeline"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              selectClip(null);
            }
          }}
        >
          <div className="relative" style={{ width: timelineWidth }}>
            <TimeRuler gridLines={gridLines} width={timelineWidth} />
            <div
              className="relative h-20 border-b border-zinc-800 bg-zinc-900/70"
              style={rowGridStyle}
            >
              <MainWaveform className="absolute inset-x-2 inset-y-2" />
            </div>

            {trackDefinitions
              .filter((track) => track.id !== "main")
              .map((track) => (
                <div
                  key={track.id}
                  className="relative h-16 border-b border-zinc-800 bg-zinc-950"
                  style={rowGridStyle}
                >
                  {clips
                    .filter((clip) => clip.trackId === track.id)
                    .map((clip) => (
                      <TimelineClip
                        key={clip.id}
                        clip={clip}
                        isDragging={dragState?.clipId === clip.id}
                        isSelected={selectedClipId === clip.id}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          selectClip(clip.id);
                          setDragState({
                            clipId: clip.id,
                            startClientX: event.clientX,
                            initialStart: clip.start,
                          });
                        }}
                        onPointerMove={(event) => {
                          if (dragState?.clipId !== clip.id) {
                            return;
                          }

                          const deltaSeconds =
                            (event.clientX - dragState.startClientX) /
                            DEFAULT_PIXELS_PER_SECOND;
                          moveClip(
                            clip.id,
                            dragState.initialStart + deltaSeconds,
                          );
                        }}
                        onPointerUp={() => setDragState(null)}
                        onSelect={() => selectClip(clip.id)}
                      />
                    ))}
                </div>
              ))}

            <div
              className="pointer-events-none absolute top-10 bottom-0 z-20 w-px bg-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
              style={{
                transform: `translateX(${secondsToPixels(
                  playheadTime,
                  DEFAULT_PIXELS_PER_SECOND,
                )}px)`,
              }}
              data-testid="playhead"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeRuler({
  gridLines,
  width,
}: {
  gridLines: ReturnType<typeof getBeatGridLines>;
  width: number;
}) {
  return (
    <div
      className="sticky top-0 z-10 h-10 border-b border-zinc-800 bg-zinc-950"
      style={{ width }}
    >
      {gridLines.map((line) => (
        <div
          key={line.id}
          className={cn(
            "absolute bottom-0 top-0 border-l",
            line.isBar ? "border-zinc-500" : "border-zinc-800",
          )}
          style={{ transform: `translateX(${line.x}px)` }}
        >
          {line.isBar ? (
            <span className="ml-1 font-mono text-[11px] text-zinc-400">
              {line.label}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TimelineClip({
  clip,
  isDragging,
  isSelected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
}: {
  clip: StudioClip;
  isDragging: boolean;
  isSelected: boolean;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onSelect: () => void;
}) {
  const left = secondsToPixels(clip.start, DEFAULT_PIXELS_PER_SECOND);
  const width = Math.max(
    36,
    secondsToPixels(clip.duration, DEFAULT_PIXELS_PER_SECOND),
  );

  return (
    <button
      type="button"
      aria-label={`Select clip ${clip.name}`}
      className={cn(
        "absolute top-2 h-12 overflow-hidden rounded-md border px-2 text-left text-xs text-zinc-950 shadow-sm transition",
        isSelected
          ? "border-amber-200 ring-2 ring-amber-200/50"
          : "border-white/20",
        isDragging && "cursor-grabbing opacity-90",
      )}
      data-testid="timeline-clip"
      style={{
        left,
        width,
        backgroundColor: clip.color,
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <span className="block truncate font-semibold">{clip.name}</span>
      <span className="mt-1 block truncate font-mono text-[11px] opacity-75">
        {clip.start.toFixed(2)}s · {Math.round(clip.volume * 100)}%
      </span>
    </button>
  );
}
