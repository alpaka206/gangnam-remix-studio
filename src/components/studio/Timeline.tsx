"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
  type WheelEvent as ReactWheelEvent,
} from "react";

import { MainWaveform } from "@/components/studio/MainWaveform";
import {
  createUploadedSampleInputs,
  findUnsupportedAudioFile,
} from "@/lib/audio/importSamples";
import { cn } from "@/lib/cn";
import { getSampleDragData } from "@/lib/timeline/drag";
import {
  DEFAULT_PIXELS_PER_SECOND,
  formatBarsBeats,
  getBeatGridLines,
  getTimelineDuration,
  pixelsToSeconds,
  secondsToPixels,
} from "@/lib/timeline/time";
import { useStudioStore } from "@/store/studioStore";
import type { StudioClip } from "@/types/studio";

type DragState = {
  clipId: string;
  startClientX: number;
  initialStart: number;
};

type TimelineClipboard =
  | { kind: "clip"; clipId: string; duration: number }
  | { kind: "sample"; sampleId: string; duration: number };

const MIN_PIXELS_PER_SECOND = 24;
const MAX_PIXELS_PER_SECOND = 180;
const ZOOM_STEP = 1.12;

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastPointerTimeRef = useRef<number | null>(null);
  const clipboardRef = useRef<TimelineClipboard | null>(null);
  const nextPasteTimeRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(
    DEFAULT_PIXELS_PER_SECOND,
  );
  const bpm = useStudioStore((state) => state.bpm);
  const clips = useStudioStore((state) => state.clips);
  const samples = useStudioStore((state) => state.samples);
  const selectedClipId = useStudioStore((state) => state.selectedClipId);
  const selectedSampleId = useStudioStore((state) => state.selectedSampleId);
  const playheadTime = useStudioStore((state) => state.playheadTime);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const selectClip = useStudioStore((state) => state.selectClip);
  const selectSample = useStudioStore((state) => state.selectSample);
  const moveClip = useStudioStore((state) => state.moveClip);
  const addSampleClip = useStudioStore((state) => state.addSampleClip);
  const addUploadedSamples = useStudioStore(
    (state) => state.addUploadedSamples,
  );
  const duplicateClip = useStudioStore((state) => state.duplicateClip);
  const deleteClip = useStudioStore((state) => state.deleteClip);

  const timelineDuration = useMemo(
    () =>
      getTimelineDuration(
        clips.map((clip) => clip.start + clip.duration),
        mainTrack.duration,
      ),
    [clips, mainTrack.duration],
  );
  const timelineWidth = secondsToPixels(timelineDuration, pixelsPerSecond);
  const gridLines = useMemo(
    () =>
      getBeatGridLines({
        duration: timelineDuration,
        bpm,
        pixelsPerSecond,
      }),
    [bpm, pixelsPerSecond, timelineDuration],
  );
  const rowGridStyle = useMemo<CSSProperties>(() => {
    const beatWidth = secondsToPixels(60 / bpm, pixelsPerSecond);
    const barWidth = beatWidth * 4;

    return {
      width: timelineWidth,
      backgroundImage:
        "linear-gradient(to right, rgba(63,63,70,0.7) 1px, transparent 1px), linear-gradient(to right, rgba(113,113,122,0.75) 1px, transparent 1px)",
      backgroundSize: `${beatWidth}px 100%, ${barWidth}px 100%`,
    };
  }, [bpm, pixelsPerSecond, timelineWidth]);
  const mainWaveformWidth = Math.max(
    160,
    secondsToPixels(mainTrack.duration, pixelsPerSecond),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedClipId
      ) {
        deleteClip(selectedClipId);
        event.preventDefault();
        return;
      }

      const isShortcut = event.ctrlKey || event.metaKey;

      if (!isShortcut) {
        return;
      }

      if (event.key.toLowerCase() === "c") {
        const selectedClip = clips.find((clip) => clip.id === selectedClipId);

        if (selectedClip) {
          clipboardRef.current = {
            kind: "clip",
            clipId: selectedClip.id,
            duration: selectedClip.duration,
          };
          nextPasteTimeRef.current = null;
          event.preventDefault();
          return;
        }

        const selectedSample = samples.find(
          (sample) => sample.id === selectedSampleId,
        );

        if (selectedSample) {
          clipboardRef.current = {
            kind: "sample",
            sampleId: selectedSample.id,
            duration: Math.max(
              0.25,
              selectedSample.duration || mainTrack.duration || 1,
            ),
          };
          nextPasteTimeRef.current = null;
          event.preventDefault();
        }
      }

      if (event.key.toLowerCase() === "v") {
        const clipboard = clipboardRef.current;

        if (!clipboard) {
          return;
        }

        const start =
          nextPasteTimeRef.current ??
          lastPointerTimeRef.current ??
          playheadTime;
        const clipId =
          clipboard.kind === "clip"
            ? duplicateClip(clipboard.clipId, { start, snap: false })
            : addSampleClip(clipboard.sampleId, { start, snap: false });

        if (clipId) {
          nextPasteTimeRef.current = start + clipboard.duration;
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    addSampleClip,
    clips,
    deleteClip,
    duplicateClip,
    mainTrack.duration,
    playheadTime,
    samples,
    selectedClipId,
    selectedSampleId,
  ]);

  function getTimeFromClientX(clientX: number) {
    const timeline = timelineRef.current;

    if (!timeline) {
      return 0;
    }

    const rect = timeline.getBoundingClientRect();
    const x = clientX - rect.left + timeline.scrollLeft;

    return pixelsToSeconds(x, pixelsPerSecond);
  }

  function updatePointerTime(event: ReactPointerEvent<HTMLDivElement>) {
    lastPointerTimeRef.current = getTimeFromClientX(event.clientX);
  }

  async function handleTimelineDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropActive(false);

    const start = getTimeFromClientX(event.clientX);
    const sampleId = getSampleDragData(event.dataTransfer);

    if (sampleId) {
      selectSample(sampleId);
      addSampleClip(sampleId, { start, snap: false });
      setDropError(null);
      return;
    }

    const files = Array.from(event.dataTransfer.files ?? []);

    if (files.length === 0) {
      return;
    }

    const invalidFile = findUnsupportedAudioFile(files);

    if (invalidFile) {
      setDropError(`${invalidFile.name} is not a supported audio file.`);
      return;
    }

    const uploadedSamples = await createUploadedSampleInputs(files);
    addUploadedSamples(uploadedSamples);

    let nextStart = start;

    for (const sample of uploadedSamples) {
      addSampleClip(sample.id, { start: nextStart, snap: false });
      nextStart += Math.max(0.25, sample.duration || 1);
    }

    setDropError(null);
  }

  function handleTimelineWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (Math.abs(event.deltaY) < 1) {
      return;
    }

    event.preventDefault();

    const timeline = timelineRef.current;

    if (!timeline) {
      return;
    }

    const rect = timeline.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorTime = pixelsToSeconds(
      cursorX + timeline.scrollLeft,
      pixelsPerSecond,
    );
    const zoomFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    const nextPixelsPerSecond = Math.min(
      MAX_PIXELS_PER_SECOND,
      Math.max(MIN_PIXELS_PER_SECOND, Math.round(pixelsPerSecond * zoomFactor)),
    );

    if (nextPixelsPerSecond === pixelsPerSecond) {
      return;
    }

    setPixelsPerSecond(nextPixelsPerSecond);

    requestAnimationFrame(() => {
      timeline.scrollLeft = Math.max(
        0,
        secondsToPixels(cursorTime, nextPixelsPerSecond) - cursorX,
      );
    });
  }

  return (
    <section className="relative min-h-0 select-none overflow-hidden bg-[#111315]">
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
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              Click + to add. Drag sounds or audio files onto the grid. Wheel to
              zoom.
            </p>
            {dropError ? (
              <p className="mt-0.5 text-xs text-rose-300">{dropError}</p>
            ) : null}
          </div>
        </div>

        <div
          ref={timelineRef}
          className="min-h-0 flex-1 overflow-auto"
          data-testid="timeline"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDropActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsDropActive(true);
          }}
          onDragLeave={(event) => {
            const relatedTarget = event.relatedTarget;

            if (
              relatedTarget instanceof Node &&
              event.currentTarget.contains(relatedTarget)
            ) {
              return;
            }

            setIsDropActive(false);
          }}
          onDrop={handleTimelineDrop}
          onPointerMove={updatePointerTime}
          onPointerDown={(event) => {
            updatePointerTime(event);
            if (event.target === event.currentTarget) {
              selectClip(null);
            }
          }}
          onWheel={handleTimelineWheel}
        >
          <div
            className="relative"
            data-testid="timeline-content"
            style={{ width: timelineWidth }}
          >
            <TimeRuler gridLines={gridLines} width={timelineWidth} />
            {mainTrack.fileName ? (
              <div
                className="relative h-20 border-b border-zinc-800 bg-zinc-900/70"
                style={rowGridStyle}
              >
                <MainWaveform
                  className="absolute bottom-2 left-2 top-2"
                  style={{ width: mainWaveformWidth }}
                />
              </div>
            ) : null}

            <div
              className="relative h-20 border-b border-zinc-800 bg-zinc-950"
              style={rowGridStyle}
            >
              {clips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  isDragging={dragState?.clipId === clip.id}
                  isSelected={selectedClipId === clip.id}
                  pixelsPerSecond={pixelsPerSecond}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
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
                      pixelsPerSecond;
                    moveClip(clip.id, dragState.initialStart + deltaSeconds);
                  }}
                  onPointerUp={() => setDragState(null)}
                  onSelect={() => selectClip(clip.id)}
                />
              ))}
            </div>

            {isDropActive ? (
              <div className="pointer-events-none absolute inset-x-3 top-14 z-30 flex h-16 items-center justify-center rounded-md border border-amber-300/70 bg-amber-300/10 text-sm font-medium text-amber-100">
                Drop here to place at this position
              </div>
            ) : null}

            <div
              className="pointer-events-none absolute top-10 bottom-0 z-20 w-px bg-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
              style={{
                transform: `translateX(${secondsToPixels(
                  playheadTime,
                  pixelsPerSecond,
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
  pixelsPerSecond,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
}: {
  clip: StudioClip;
  isDragging: boolean;
  isSelected: boolean;
  pixelsPerSecond: number;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onSelect: () => void;
}) {
  const left = secondsToPixels(clip.start, pixelsPerSecond);
  const width = Math.max(36, secondsToPixels(clip.duration, pixelsPerSecond));

  return (
    <button
      type="button"
      aria-label={`Select sound ${clip.name}`}
      className={cn(
        "absolute top-2 h-12 select-none overflow-hidden rounded-md border px-2 text-left text-xs text-zinc-950 shadow-sm transition",
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
        {clip.start.toFixed(2)}s / {Math.round(clip.volume * 100)}%
      </span>
    </button>
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
