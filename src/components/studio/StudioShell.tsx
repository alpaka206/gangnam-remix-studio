"use client";

import { ClipInspector } from "@/components/studio/ClipInspector";
import { SampleLibrary } from "@/components/studio/SampleLibrary";
import { Timeline } from "@/components/studio/Timeline";
import { TrackList } from "@/components/studio/TrackList";
import { TransportBar } from "@/components/studio/TransportBar";
import { useMixExport } from "@/lib/audio/useMixExport";
import { useStudioPlayback } from "@/lib/audio/useStudioPlayback";

export function StudioShell() {
  const { stopPlayback, togglePlayback } = useStudioPlayback();
  const exportMix = useMixExport();

  return (
    <main className="flex min-h-screen flex-col bg-[#111315] text-zinc-100">
      <TransportBar
        onExportMix={exportMix}
        onStopPlayback={stopPlayback}
        onTogglePlayback={togglePlayback}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(420px,1fr)_auto_auto] overflow-hidden lg:grid-cols-[220px_minmax(680px,1fr)_300px] lg:grid-rows-[minmax(0,1fr)_210px]">
        <div className="h-full min-h-64 lg:min-h-0">
          <TrackList />
        </div>
        <Timeline />
        <div className="h-full min-h-72 lg:min-h-0">
          <ClipInspector />
        </div>
        <div className="lg:col-span-3">
          <SampleLibrary />
        </div>
      </div>
    </main>
  );
}
