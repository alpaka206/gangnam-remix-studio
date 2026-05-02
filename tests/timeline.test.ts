import { describe, expect, it } from "vitest";

import {
  beatDuration,
  formatBarsBeats,
  formatTime,
  getBeatGridLines,
  getTimeRulerLines,
  getTimelineDuration,
  pixelsToSeconds,
  secondsToPixels,
  snapTimeToBeat,
} from "@/lib/timeline/time";

describe("timeline utilities", () => {
  it("converts seconds and pixels with a fixed scale", () => {
    expect(secondsToPixels(2, 50)).toBe(100);
    expect(pixelsToSeconds(125, 50)).toBe(2.5);
  });

  it("snaps clip positions to the nearest beat", () => {
    expect(beatDuration(120)).toBe(0.5);
    expect(snapTimeToBeat(1.26, 120, true)).toBe(1.5);
    expect(snapTimeToBeat(1.26, 120, false)).toBe(1.26);
  });

  it("builds bar and beat grid markers", () => {
    const grid = getBeatGridLines({
      duration: 2,
      bpm: 120,
      pixelsPerSecond: 40,
    });

    expect(grid[0]).toMatchObject({ bar: 1, beat: 1, isBar: true, x: 0 });
    expect(grid[4]).toMatchObject({ bar: 2, beat: 1, isBar: true, x: 80 });
  });

  it("formats timeline labels", () => {
    expect(formatTime(63.456)).toBe("1:03.46");
    expect(formatBarsBeats(2.2, 120)).toBe("2.1");
  });

  it("uses time labels that gain detail as the timeline zooms in", () => {
    const defaultRuler = getTimeRulerLines({
      duration: 8,
      pixelsPerSecond: 48,
    });
    const zoomedRuler = getTimeRulerLines({
      duration: 2,
      pixelsPerSecond: 180,
    });

    expect(defaultRuler.lines.slice(0, 3).map((line) => line.label)).toEqual([
      "0:00",
      "0:02",
      "0:04",
    ]);
    expect(zoomedRuler.lines.slice(0, 3).map((line) => line.label)).toEqual([
      "0:00.0",
      "0:00.5",
      "0:01.0",
    ]);
  });

  it("keeps at least a 32 second editing surface", () => {
    expect(getTimelineDuration([4, 8], 0)).toBe(32);
    expect(getTimelineDuration([36], 0)).toBe(44);
  });
});
