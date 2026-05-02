"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

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

import { EffectLane } from "./timeline/EffectLane";
import { MainLane } from "./timeline/MainLane";
import { TimeRuler } from "./timeline/TimeRuler";
import { LANE_LABEL_WIDTH } from "./timeline/constants";
import { canStartTimelinePan } from "./timeline/dom";
import type { DragState, TimelinePanState } from "./timeline/types";
import { useTimelineKeyboardShortcuts } from "./timeline/useTimelineKeyboardShortcuts";
import { useTimelineZoom } from "./timeline/useTimelineZoom";

export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<TimelinePanState | null>(null);
  const lastPointerTimeRef = useRef<number | null>(null);
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
  const clipsBySampleId = useMemo(() => {
    const groupedClips = new Map<string, StudioClip[]>();

    for (const clip of clips) {
      if (!clip.sampleId) {
        continue;
      }

      const sampleClips = groupedClips.get(clip.sampleId) ?? [];
      sampleClips.push(clip);
      groupedClips.set(clip.sampleId, sampleClips);
    }

    return groupedClips;
  }, [clips]);

  useTimelineKeyboardShortcuts({
    addSampleClip,
    clips,
    deleteClip,
    duplicateClip,
    lastPointerTimeRef,
    playheadTime,
    samples,
    selectedClipId,
    selectedSampleId,
  });

  useTimelineZoom({
    pixelsPerSecond,
    setPixelsPerSecond,
    timelineRef,
  });

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

  function handleTimelineDrop(event: ReactDragEvent<HTMLDivElement>) {
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

  function handleTimelinePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    updatePointerTime(event);

    const panState = panStateRef.current;

    if (!panState || panState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.currentTarget.scrollLeft =
      panState.startScrollLeft - (event.clientX - panState.startClientX);
  }

  function handleTimelinePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    updatePointerTime(event);

    if (!canStartTimelinePan(event.target)) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    panStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    };
    setIsPanning(true);
    selectClip(null);
  }

  function handleTimelinePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (panStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    panStateRef.current = null;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleTimelinePointerCancel() {
    panStateRef.current = null;
    setIsPanning(false);
  }

  function handleClipPointerDown(
    clip: StudioClip,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    selectClip(clip.id);
    setDragState({
      clipId: clip.id,
      startClientX: event.clientX,
      initialStart: clip.start,
    });
  }

  function handleClipPointerMove(
    clip: StudioClip,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (dragState?.clipId !== clip.id) {
      return;
    }

    const deltaSeconds =
      (event.clientX - dragState.startClientX) / pixelsPerSecond;
    moveClip(clip.id, dragState.initialStart + deltaSeconds);
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
          onPointerCancel={handleTimelinePointerCancel}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerUp}
        >
          <div
            className="relative"
            data-testid="timeline-content"
            style={{ width: timelineWidth }}
          >
            <TimeRuler ruler={timeRuler} width={timelineWidth} />
            <MainLane
              hasMainTrack={Boolean(mainTrack.fileName)}
              rowGridStyle={rowGridStyle}
              waveformWidth={mainWaveformWidth}
            />

            <div className="relative bg-zinc-950" data-testid="effect-lanes">
              {effectLaneSamples.map((sample, index) => (
                <EffectLane
                  key={sample.id}
                  sample={sample}
                  sampleIndex={index}
                  clips={clipsBySampleId.get(sample.id) ?? []}
                  dragState={dragState}
                  selectedClipId={selectedClipId}
                  pixelsPerSecond={pixelsPerSecond}
                  rowGridStyle={rowGridStyle}
                  onClipPointerDown={handleClipPointerDown}
                  onClipPointerMove={handleClipPointerMove}
                  onClipPointerUp={() => setDragState(null)}
                  onSelectClip={selectClip}
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
