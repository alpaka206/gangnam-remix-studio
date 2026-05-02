import type { PointerEventHandler } from "react";

import {
  EFFECT_CLIP_HEIGHT,
  LANE_LABEL_WIDTH,
} from "@/components/studio/timeline/constants";
import { cn } from "@/lib/cn";
import { secondsToPixels } from "@/lib/timeline/time";
import type { StudioClip } from "@/types/studio";

type TimelineClipProps = {
  clip: StudioClip;
  isDragging: boolean;
  isSelected: boolean;
  pixelsPerSecond: number;
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onSelect: () => void;
};

export function TimelineClip({
  clip,
  isDragging,
  isSelected,
  pixelsPerSecond,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelect,
}: TimelineClipProps) {
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
