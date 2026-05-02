"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type WaveSurfer from "wavesurfer.js";

import { cn } from "@/lib/cn";
import { useStudioStore } from "@/store/studioStore";

type MainWaveformProps = {
  className?: string;
  style?: CSSProperties;
};

export function MainWaveform({ className, style }: MainWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);

  useEffect(() => {
    let cancelled = false;

    async function createWaveform() {
      if (!containerRef.current || !mainTrack.objectUrl) {
        return;
      }

      const WaveSurferModule = await import("wavesurfer.js");

      if (cancelled || !containerRef.current) {
        return;
      }

      waveSurferRef.current?.destroy();
      waveSurferRef.current = WaveSurferModule.default.create({
        container: containerRef.current,
        url: mainTrack.objectUrl,
        height: 56,
        normalize: true,
        interact: false,
        cursorWidth: 0,
        waveColor: "#94a3b8",
        progressColor: "#fbbf24",
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
      });

      waveSurferRef.current.on("ready", (duration) => {
        if (duration > 0 && mainTrack.duration === 0) {
          setMainTrack({ ...mainTrack, duration, status: "ready" });
        }
      });
    }

    createWaveform();

    return () => {
      cancelled = true;
      waveSurferRef.current?.destroy();
      waveSurferRef.current = null;
    };
  }, [mainTrack, setMainTrack]);

  return (
    <div
      className={cn(
        "h-full min-h-14 w-full overflow-hidden rounded-md border border-zinc-700 bg-zinc-950/60",
        className,
      )}
      style={style}
      data-testid="main-waveform"
    >
      {mainTrack.objectUrl ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="flex h-full items-center px-3 text-xs font-medium text-zinc-400">
          Restoring uploaded audio for waveform playback
        </div>
      )}
    </div>
  );
}
