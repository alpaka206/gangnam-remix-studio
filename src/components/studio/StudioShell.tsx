"use client";

import { ClipInspector } from "@/components/studio/ClipInspector";
import { SampleLibrary } from "@/components/studio/SampleLibrary";
import { Timeline } from "@/components/studio/Timeline";
import { TransportBar } from "@/components/studio/TransportBar";
import { useLaunchpadController } from "@/components/studio/useLaunchpadController";
import { useMixExport } from "@/lib/audio/useMixExport";
import { usePersistedAudioAssets } from "@/lib/audio/usePersistedAudioAssets";
import { useStudioPlayback } from "@/lib/audio/useStudioPlayback";

export function StudioShell() {
  const { startPlayback, stopPlayback, togglePlayback } = useStudioPlayback();
  const exportMix = useMixExport();
  const {
    launchSample,
    launchpadPitchSemitones,
    launchpadSpeed,
    resetEffects,
    setLaunchpadPitchSemitones,
    setLaunchpadSpeed,
  } = useLaunchpadController({
    startPlayback,
    stopPlayback,
  });

  usePersistedAudioAssets();

  return (
    <main className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#111315] text-zinc-100">
      <TransportBar
        onExportMix={exportMix}
        onStopPlayback={stopPlayback}
        onTogglePlayback={togglePlayback}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,0.42fr)_268px] overflow-hidden md:grid-cols-[minmax(0,1fr)_300px] md:grid-rows-[minmax(0,1fr)_168px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <Timeline />
        <div className="h-full min-h-0">
          <ClipInspector />
        </div>
        <div className="min-h-0 md:col-span-2">
          <SampleLibrary
            launchpadPitchSemitones={launchpadPitchSemitones}
            launchpadSpeed={launchpadSpeed}
            onLaunchpadPitchChange={setLaunchpadPitchSemitones}
            onLaunchpadSpeedChange={setLaunchpadSpeed}
            onResetEffects={resetEffects}
            onTriggerSample={launchSample}
          />
        </div>
      </div>
    </main>
  );
}
