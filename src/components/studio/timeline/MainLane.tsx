import type { CSSProperties } from "react";

import { MainWaveform } from "@/components/studio/MainWaveform";
import {
  LANE_LABEL_WIDTH,
  MAIN_LANE_HEIGHT,
} from "@/components/studio/timeline/constants";

type MainLaneProps = {
  hasMainTrack: boolean;
  rowGridStyle: CSSProperties;
  waveformWidth: number;
};

export function MainLane({
  hasMainTrack,
  rowGridStyle,
  waveformWidth,
}: MainLaneProps) {
  return (
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
      {hasMainTrack ? (
        <MainWaveform
          className="absolute bottom-0 top-0 rounded-none border-y-0"
          style={{
            left: LANE_LABEL_WIDTH,
            width: waveformWidth,
          }}
        />
      ) : null}
    </div>
  );
}
