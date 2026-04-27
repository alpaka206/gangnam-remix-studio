"use client";

import { useEffect, useMemo, useRef } from "react";
import type WaveSurfer from "wavesurfer.js";

import { cn } from "@/lib/cn";
import { useStudioStore } from "@/store/studioStore";

type MainWaveformProps = {
  className?: string;
};

export function MainWaveform({ className }: MainWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);
  const placeholderBars = useMemo(
    () =>
      Array.from({ length: 96 }, (_, index) => {
        const level =
          Math.sin(index * 0.55) * 0.35 + Math.sin(index * 0.17) * 0.3;
        return Math.max(12, Math.round((0.55 + level) * 52));
      }),
    [],
  );

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
        height: 50,
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
        "relative h-full min-h-14 w-full overflow-hidden rounded-md border border-zinc-700 bg-zinc-950/60",
        className,
      )}
      data-testid="main-waveform"
    >
      {mainTrack.objectUrl ? (
        <div ref={containerRef} className="h-full w-full px-2 py-2" />
      ) : (
        <div className="flex h-full items-center gap-px px-3">
          {placeholderBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-1 flex-1 rounded-sm bg-zinc-600/60"
              style={{ height }}
            />
          ))}
          <span className="absolute px-2 text-xs font-medium text-zinc-400">
            {mainTrack.fileName
              ? "Restoring uploaded audio for waveform playback"
              : "Upload main music to generate waveform"}
          </span>
        </div>
      )}
    </div>
  );
}
