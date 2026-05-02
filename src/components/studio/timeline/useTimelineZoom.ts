import { useCallback, useEffect, type RefObject } from "react";

import {
  LANE_LABEL_WIDTH,
  MAX_PIXELS_PER_SECOND,
  MIN_PIXELS_PER_SECOND,
  ZOOM_STEP,
} from "@/components/studio/timeline/constants";
import { pixelsToSeconds, secondsToPixels } from "@/lib/timeline/time";

type UseTimelineZoomOptions = {
  pixelsPerSecond: number;
  setPixelsPerSecond: (pixelsPerSecond: number) => void;
  timelineRef: RefObject<HTMLDivElement | null>;
};

export function useTimelineZoom({
  pixelsPerSecond,
  setPixelsPerSecond,
  timelineRef,
}: UseTimelineZoomOptions) {
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
      });
    },
    [pixelsPerSecond, setPixelsPerSecond, timelineRef],
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
  }, [handleTimelineWheel, timelineRef]);
}
