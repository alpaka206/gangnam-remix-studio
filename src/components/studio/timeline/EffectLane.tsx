import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import { getLaunchpadShortcutForIndex } from "@/data/studioData";
import {
  EFFECT_LANE_HEIGHT,
  LANE_LABEL_WIDTH,
} from "@/components/studio/timeline/constants";
import { TimelineClip } from "@/components/studio/timeline/TimelineClip";
import type { DragState } from "@/components/studio/timeline/types";
import type { SampleItem, StudioClip } from "@/types/studio";

type EffectLaneProps = {
  sample: SampleItem;
  sampleIndex: number;
  clips: StudioClip[];
  dragState: DragState | null;
  selectedClipId: string | null;
  pixelsPerSecond: number;
  rowGridStyle: CSSProperties;
  onClipPointerDown: (
    clip: StudioClip,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onClipPointerMove: (
    clip: StudioClip,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => void;
  onClipPointerUp: () => void;
  onSelectClip: (clipId: string) => void;
};

export function EffectLane({
  sample,
  sampleIndex,
  clips,
  dragState,
  selectedClipId,
  pixelsPerSecond,
  rowGridStyle,
  onClipPointerDown,
  onClipPointerMove,
  onClipPointerUp,
  onSelectClip,
}: EffectLaneProps) {
  return (
    <div
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
          {getLaunchpadShortcutForIndex(sampleIndex)}
        </span>
      </div>
      {clips.map((clip) => (
        <TimelineClip
          key={clip.id}
          clip={clip}
          isDragging={dragState?.clipId === clip.id}
          isSelected={selectedClipId === clip.id}
          pixelsPerSecond={pixelsPerSecond}
          onPointerDown={(event) => onClipPointerDown(clip, event)}
          onPointerMove={(event) => onClipPointerMove(clip, event)}
          onPointerUp={onClipPointerUp}
          onSelect={() => onSelectClip(clip.id)}
        />
      ))}
    </div>
  );
}
