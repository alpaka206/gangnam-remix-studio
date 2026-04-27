"use client";

import { useCallback } from "react";

import { downloadBlob, renderMixToWav } from "@/lib/audio/exportMix";
import { useStudioStore } from "@/store/studioStore";

export function useMixExport() {
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const clips = useStudioStore((state) => state.clips);
  const samples = useStudioStore((state) => state.samples);
  const speed = useStudioStore((state) => state.speed);
  const setExportStatus = useStudioStore((state) => state.setExportStatus);
  const setExportError = useStudioStore((state) => state.setExportError);

  return useCallback(async () => {
    setExportStatus("rendering");
    setExportError(null);

    try {
      const blob = await renderMixToWav({ mainTrack, clips, samples, speed });
      downloadBlob(blob, `gangnam-remix-${Date.now()}.wav`);
      setExportStatus("ready");
    } catch (error) {
      setExportStatus("error");
      setExportError(
        error instanceof Error ? error.message : "Export failed unexpectedly.",
      );
    }
  }, [
    clips,
    mainTrack,
    samples,
    setExportError,
    setExportStatus,
    speed,
  ]);
}
