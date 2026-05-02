"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
} from "react";

import { MainWaveform } from "@/components/studio/MainWaveform";
import { getLaunchpadShortcutForIndex } from "@/data/studioData";
import { cn } from "@/lib/cn";
import { getSampleDragData } from "@/lib/timeline/drag";
import {
  DEFAULT_PIXELS_PER_SECOND,
  formatTime,
  getTimeRulerLines,
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

type TimelinePanState = {
  pointerId: number;
  startClientX: number;
  startScrollLeft: number;
};

type TimelineClipboard =
  | { kind: "clip"; clipId: string; duration: number }
  | { kind: "sample"; sampleId: string; duration: number };

const MIN_PIXELS_PER_SECOND = 24;
const MAX_PIXELS_PER_SECOND = 180;
const ZOOM_STEP = 1.12;
const MAIN_LANE_HEIGHT = 56;
const EFFECT_CLIP_HEIGHT = 32;
const EFFECT_LANE_HEIGHT = EFFECT_CLIP_HEIGHT;
const LANE_LABEL_WIDTH = 128;

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const wheelTargetScrollLeftRef = useRef<number | null>(null);
  const panStateRef = useRef<TimelinePanState | null>(null);
  const lastPointerTimeRef = useRef<number | null>(null);
  const clipboardRef = useRef<TimelineClipboard | null>(null);
  const nextPasteTimeRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(
    DEFAULT_PIXELS_PER_SECOND,
  );
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
  const timelinePlotWidth = secondsToPixels(timelineDuration, pixelsPerSecond);
  const timelineWidth = LANE_LABEL_WIDTH + timelinePlotWidth;
  const timeRuler = useMemo(
    () =>
      getTimeRulerLines({
        duration: timelineDuration,
        pixelsPerSecond,
      }),
    [pixelsPerSecond, timelineDuration],
  );
  const rowGridStyle = useMemo<CSSProperties>(() => {
    const majorWidth = secondsToPixels(timeRuler.step, pixelsPerSecond);
    const minorWidth = Math.max(12, majorWidth / 4);

    return {
      width: timelineWidth,
      backgroundImage:
        "linear-gradient(to right, rgba(63,63,70,0.7) 1px, transparent 1px), linear-gradient(to right, rgba(113,113,122,0.75) 1px, transparent 1px)",
      backgroundPosition: `${LANE_LABEL_WIDTH}px 0, ${LANE_LABEL_WIDTH}px 0`,
      backgroundSize: `${minorWidth}px 100%, ${majorWidth}px 100%`,
    };
  }, [pixelsPerSecond, timeRuler.step, timelineWidth]);
  const mainWaveformWidth = secondsToPixels(
    mainTrack.duration,
    pixelsPerSecond,
  );
  const effectLaneSamples = samples.slice(0, 16);

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
            duration: Math.max(0.25, selectedSample.duration || 1),
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
    const x = clientX - rect.left + timeline.scrollLeft - LANE_LABEL_WIDTH;

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

    if (event.dataTransfer.files.length > 0) {
      setDropError("Effect uploads are disabled for now.");
    }
  }

  const handleTimelineWheel = useCallback(
    (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 1 && Math.abs(event.deltaX) < 1) {
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      const timeline = timelineRef.current;

      if (!timeline) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      const rect = timeline.getBoundingClientRect();
      const cursorX = event.clientX - rect.left;
      const cursorTime = pixelsToSeconds(
        cursorX + timeline.scrollLeft - LANE_LABEL_WIDTH,
        pixelsPerSecond,
      );
      const zoomFactor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      const nextPixelsPerSecond = Math.min(
        MAX_PIXELS_PER_SECOND,
        Math.max(
          MIN_PIXELS_PER_SECOND,
          Math.round(pixelsPerSecond * zoomFactor),
        ),
      );

      if (nextPixelsPerSecond === pixelsPerSecond) {
        return;
      }

      setPixelsPerSecond(nextPixelsPerSecond);

      requestAnimationFrame(() => {
        timeline.scrollLeft = Math.max(
          0,
          LANE_LABEL_WIDTH +
            secondsToPixels(cursorTime, nextPixelsPerSecond) -
            cursorX,
        );
        wheelTargetScrollLeftRef.current = timeline.scrollLeft;
      });
    },
    [pixelsPerSecond],
  );

  useEffect(() => {
    const timeline = timelineRef.current;

    if (!timeline) {
      return;
    }

    timeline.addEventListener("wheel", handleTimelineWheel, {
      passive: false,
    });

    return () => {
      timeline.removeEventListener("wheel", handleTimelineWheel);
    };
  }, [handleTimelineWheel]);

  return (
    <section className="relative min-h-0 select-none overflow-hidden bg-[#111315]">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
          <div>
            <h1 className="text-sm font-semibold text-zinc-50">
              Gangnam Remix Studio
            </h1>
            <p className="font-mono text-xs text-zinc-500">
              time {formatTime(playheadTime)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              Wheel scrolls lanes. Drag empty space sideways. Ctrl+Wheel zooms.
            </p>
            {dropError ? (
              <p className="mt-0.5 text-xs text-rose-300">{dropError}</p>
            ) : null}
          </div>
        </div>

        <div
          ref={timelineRef}
          className={cn(
            "studio-scrollbar min-h-0 flex-1 overflow-auto scroll-smooth",
            isPanning && "cursor-grabbing",
          )}
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
          onPointerMove={(event) => {
            updatePointerTime(event);

            const panState = panStateRef.current;

            if (!panState || panState.pointerId !== event.pointerId) {
              return;
            }

            event.preventDefault();
            event.currentTarget.scrollLeft =
              panState.startScrollLeft -
              (event.clientX - panState.startClientX);
            wheelTargetScrollLeftRef.current = event.currentTarget.scrollLeft;
          }}
          onPointerDown={(event) => {
            updatePointerTime(event);

            if (canStartTimelinePan(event.target)) {
              event.currentTarget.setPointerCapture(event.pointerId);
              panStateRef.current = {
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startScrollLeft: event.currentTarget.scrollLeft,
              };
              setIsPanning(true);
              selectClip(null);
            }
          }}
          onPointerUp={(event) => {
            if (panStateRef.current?.pointerId === event.pointerId) {
              panStateRef.current = null;
              setIsPanning(false);
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          onPointerCancel={() => {
            panStateRef.current = null;
            setIsPanning(false);
          }}
        >
          <div
            className="relative"
            data-testid="timeline-content"
            style={{ width: timelineWidth }}
          >
            <TimeRuler ruler={timeRuler} width={timelineWidth} />
            <div
              className="sticky top-10 z-20 border-b border-amber-300/20 bg-zinc-900/95"
              data-testid="main-lane"
              style={{ ...rowGridStyle, height: MAIN_LANE_HEIGHT }}
            >
              <div
                className="sticky left-0 z-20 flex h-full items-center border-r border-zinc-800 bg-zinc-950/95 px-3 text-xs font-semibold uppercase tracking-wide text-amber-200"
                data-lane-label="true"
                style={{ width: LANE_LABEL_WIDTH }}
              >
                Main
              </div>
              {mainTrack.fileName ? (
                <MainWaveform
                  className="absolute bottom-0 top-0 rounded-none border-y-0"
                  style={{
                    left: LANE_LABEL_WIDTH,
                    width: mainWaveformWidth,
                  }}
                />
              ) : null}
            </div>

            <div className="relative bg-zinc-950" data-testid="effect-lanes">
              {effectLaneSamples.map((sample, index) => {
                const laneClips = clips.filter(
                  (clip) => clip.sampleId === sample.id,
                );

                return (
                  <div
                    key={sample.id}
                    className="relative cursor-grab active:cursor-grabbing"
                    data-testid="effect-lane"
                    style={{
                      ...rowGridStyle,
                      height: EFFECT_LANE_HEIGHT,
                      boxShadow: "inset 0 -1px 0 rgb(39 39 42)",
                    }}
                  >
                    <div
                      className="sticky left-0 z-10 flex h-full items-center gap-2 border-r border-zinc-800 bg-zinc-950/95 px-3"
                      data-lane-label="true"
                      style={{ width: LANE_LABEL_WIDTH }}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: sample.color }}
                      />
                      <span className="min-w-0 truncate text-xs font-medium text-zinc-300">
                        {sample.name || "Sound"}
                      </span>
                      <span className="ml-auto shrink-0 font-mono text-[10px] uppercase text-zinc-600">
                        {getLaunchpadShortcutForIndex(index)}
                      </span>
                    </div>
                    {laneClips.map((clip) => (
                      <TimelineClip
                        key={clip.id}
                        clip={clip}
                        isDragging={dragState?.clipId === clip.id}
                        isSelected={selectedClipId === clip.id}
                        pixelsPerSecond={pixelsPerSecond}
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
                            pixelsPerSecond;
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
                );
              })}
            </div>

            {isDropActive ? (
              <div className="pointer-events-none absolute inset-x-3 top-14 z-30 flex h-16 items-center justify-center rounded-md border border-amber-300/70 bg-amber-300/10 text-sm font-medium text-amber-100">
                Drop here to place at this position
              </div>
            ) : null}

            <div
              className="pointer-events-none absolute top-10 bottom-0 z-20 w-px bg-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
              style={{
                transform: `translateX(${
                  LANE_LABEL_WIDTH +
                  secondsToPixels(playheadTime, pixelsPerSecond)
                }px)`,
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
  ruler,
  width,
}: {
  ruler: ReturnType<typeof getTimeRulerLines>;
  width: number;
}) {
  return (
    <div
      className="sticky top-0 z-10 h-10 border-b border-zinc-800 bg-zinc-950"
      data-testid="time-ruler"
      style={{ width }}
    >
      <div
        className="sticky left-0 z-20 h-full border-r border-zinc-800 bg-zinc-950"
        style={{ width: LANE_LABEL_WIDTH }}
      />
      {ruler.lines.map((line) => (
        <div
          key={line.id}
          className="absolute bottom-0 top-0 border-l border-zinc-500"
          style={{ transform: `translateX(${LANE_LABEL_WIDTH + line.x}px)` }}
        >
          <span
            className="ml-1 font-mono text-[11px] text-zinc-400"
            data-testid="ruler-time-label"
          >
            {line.label}
          </span>
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
  const width = Math.max(8, secondsToPixels(clip.duration, pixelsPerSecond));

  return (
    <button
      type="button"
      aria-label={`Select sound ${clip.name}`}
      className={cn(
        "absolute select-none overflow-hidden rounded-sm border px-1.5 text-left text-[11px] text-zinc-950 shadow-sm transition",
        isSelected
          ? "border-amber-200 ring-2 ring-inset ring-amber-200/50"
          : "border-white/20",
        isDragging && "cursor-grabbing opacity-90",
      )}
      data-testid="timeline-clip"
      style={{
        top: 0,
        left: LANE_LABEL_WIDTH + left,
        width,
        height: EFFECT_CLIP_HEIGHT,
        lineHeight: `${EFFECT_CLIP_HEIGHT}px`,
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
    </button>
  );
}

function canStartTimelinePan(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("[data-testid='timeline-clip']")) {
    return false;
  }

  if (target.closest("[data-lane-label='true']")) {
    return false;
  }

  return true;
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
