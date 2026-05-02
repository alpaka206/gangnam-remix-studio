import type { TimelineGridLine } from "@/types/studio";

export const DEFAULT_PIXELS_PER_SECOND = 48;
export const BEATS_PER_BAR = 4;
const TIME_RULER_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60];
const TARGET_TIME_LABEL_SPACING = 84;

export interface TimelineTimeRuler {
  step: number;
  lines: TimelineTimeRulerLine[];
}

export interface TimelineTimeRulerLine {
  id: string;
  time: number;
  x: number;
  label: string;
}

export function beatDuration(bpm: number) {
  return 60 / clampBpm(bpm);
}

export function barDuration(bpm: number) {
  return beatDuration(bpm) * BEATS_PER_BAR;
}

export function secondsToPixels(
  seconds: number,
  pixelsPerSecond = DEFAULT_PIXELS_PER_SECOND,
) {
  return Math.max(0, seconds) * pixelsPerSecond;
}

export function pixelsToSeconds(
  pixels: number,
  pixelsPerSecond = DEFAULT_PIXELS_PER_SECOND,
) {
  return Math.max(0, pixels) / pixelsPerSecond;
}

export function snapTimeToBeat(time: number, bpm: number, enabled: boolean) {
  if (!enabled) {
    return Math.max(0, roundTime(time));
  }

  const beat = beatDuration(bpm);
  return Math.max(0, roundTime(Math.round(time / beat) * beat));
}

export function clampBpm(bpm: number) {
  if (!Number.isFinite(bpm)) {
    return 128;
  }

  return Math.min(220, Math.max(60, Math.round(bpm)));
}

export function clampClipStart(
  start: number,
  duration: number,
  timelineEnd: number,
) {
  return Math.min(Math.max(0, start), Math.max(0, timelineEnd - duration));
}

export function getTimelineDuration(clipEnds: number[], mainDuration = 0) {
  const contentEnd = Math.max(0, mainDuration, ...clipEnds);
  return Math.max(32, Math.ceil((contentEnd + 8) / 4) * 4);
}

export function getBeatGridLines({
  duration,
  bpm,
  pixelsPerSecond = DEFAULT_PIXELS_PER_SECOND,
}: {
  duration: number;
  bpm: number;
  pixelsPerSecond?: number;
}): TimelineGridLine[] {
  const beat = beatDuration(bpm);
  const lineCount = Math.ceil(duration / beat);

  return Array.from({ length: lineCount + 1 }, (_, index) => {
    const isBar = index % BEATS_PER_BAR === 0;
    const bar = Math.floor(index / BEATS_PER_BAR) + 1;
    const beatInBar = (index % BEATS_PER_BAR) + 1;
    const time = roundTime(index * beat);

    return {
      id: `grid-${index}`,
      time,
      x: secondsToPixels(time, pixelsPerSecond),
      beat: beatInBar,
      bar,
      isBar,
      label: isBar ? `${bar}` : "",
    };
  });
}

export function getTimeRulerLines({
  duration,
  pixelsPerSecond = DEFAULT_PIXELS_PER_SECOND,
}: {
  duration: number;
  pixelsPerSecond?: number;
}): TimelineTimeRuler {
  const step =
    TIME_RULER_STEPS.find(
      (candidate) =>
        secondsToPixels(candidate, pixelsPerSecond) >=
        TARGET_TIME_LABEL_SPACING,
    ) ?? TIME_RULER_STEPS.at(-1)!;
  const lineCount = Math.ceil(Math.max(0, duration) / step);

  return {
    step,
    lines: Array.from({ length: lineCount + 1 }, (_, index) => {
      const time = roundTime(index * step);

      return {
        id: `time-${time}`,
        time,
        x: secondsToPixels(time, pixelsPerSecond),
        label: formatRulerTime(time, step),
      };
    }),
  };
}

export function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toFixed(2).padStart(5, "0")}`;
}

export function formatRulerTime(seconds: number, step = 1) {
  const safeSeconds = Math.max(0, seconds);

  if (step < 1) {
    const decimals = step < 0.5 ? 2 : 1;
    const factor = 10 ** decimals;
    const totalTicks = Math.round(safeSeconds * factor);
    const totalWholeSeconds = Math.floor(totalTicks / factor);
    const minutes = Math.floor(totalWholeSeconds / 60);
    const secondPart = totalWholeSeconds % 60;
    const fraction = String(totalTicks % factor).padStart(decimals, "0");

    return `${minutes}:${String(secondPart).padStart(2, "0")}.${fraction}`;
  }

  const totalSeconds = Math.round(safeSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secondPart = totalSeconds % 60;

  return `${minutes}:${String(secondPart).padStart(2, "0")}`;
}

export function formatBarsBeats(seconds: number, bpm: number) {
  const totalBeats = Math.floor(Math.max(0, seconds) / beatDuration(bpm));
  const bar = Math.floor(totalBeats / BEATS_PER_BAR) + 1;
  const beat = (totalBeats % BEATS_PER_BAR) + 1;

  return `${bar}.${beat}`;
}

function roundTime(value: number) {
  return Number(value.toFixed(3));
}
