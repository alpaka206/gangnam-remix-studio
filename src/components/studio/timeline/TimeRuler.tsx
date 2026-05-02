import { LANE_LABEL_WIDTH } from "@/components/studio/timeline/constants";
import type { TimelineTimeRuler } from "@/lib/timeline/time";

type TimeRulerProps = {
  ruler: TimelineTimeRuler;
  width: number;
};

export function TimeRuler({ ruler, width }: TimeRulerProps) {
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
