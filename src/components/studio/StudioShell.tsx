"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ClipInspector } from "@/components/studio/ClipInspector";
import { SampleLibrary } from "@/components/studio/SampleLibrary";
import { Timeline } from "@/components/studio/Timeline";
import { TransportBar } from "@/components/studio/TransportBar";
import {
  LAUNCHPAD_SHORTCUT_KEYS,
  getLaunchpadShortcutForIndex,
} from "@/data/studioData";
import {
  getLaunchpadPlaybackRate,
  useLaunchpadPlayback,
} from "@/lib/audio/useLaunchpadPlayback";
import { useMixExport } from "@/lib/audio/useMixExport";
import { usePersistedAudioAssets } from "@/lib/audio/usePersistedAudioAssets";
import { useStudioPlayback } from "@/lib/audio/useStudioPlayback";
import { useStudioStore } from "@/store/studioStore";

export function StudioShell() {
  const [launchpadPitchSemitones, setLaunchpadPitchSemitones] = useState(0);
  const [launchpadSpeed, setLaunchpadSpeed] = useState(1);
  const playbackStartPendingRef = useRef(false);
  const { startPlayback, stopPlayback, togglePlayback } = useStudioPlayback();
  const { triggerSample } = useLaunchpadPlayback();
  const exportMix = useMixExport();
  const samples = useStudioStore((state) => state.samples);
  const addSampleClip = useStudioStore((state) => state.addSampleClip);
  const clearEffectClips = useStudioStore((state) => state.clearEffectClips);
  const selectSample = useStudioStore((state) => state.selectSample);

  usePersistedAudioAssets();

  const resetEffects = useCallback(() => {
    stopPlayback();
    clearEffectClips();
    setLaunchpadPitchSemitones(0);
    setLaunchpadSpeed(1);
  }, [clearEffectClips, stopPlayback]);

  const launchSample = useCallback(
    (sampleId: string) => {
      const state = useStudioStore.getState();
      const sample = state.samples.find((item) => item.id === sampleId);

      if (!sample) {
        return;
      }

      if (
        state.mainTrack.fileName &&
        !state.isPlaying &&
        !playbackStartPendingRef.current
      ) {
        playbackStartPendingRef.current = true;
        void startPlayback().finally(() => {
          playbackStartPendingRef.current = false;
        });
      }

      selectSample(sampleId);
      const launchpadPlaybackRate = getLaunchpadPlaybackRate({
        pitchSemitones: launchpadPitchSemitones,
        speed: launchpadSpeed,
      });

      addSampleClip(sampleId, {
        start: useStudioStore.getState().playheadTime,
        snap: false,
        pitchSemitones: launchpadPitchSemitones,
        playbackRate: launchpadPlaybackRate,
      });
      void triggerSample(sample, {
        pitchSemitones: launchpadPitchSemitones,
        speed: launchpadSpeed,
      });
    },
    [
      addSampleClip,
      launchpadPitchSemitones,
      launchpadSpeed,
      selectSample,
      startPlayback,
      triggerSample,
    ],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const sampleIndex = LAUNCHPAD_SHORTCUT_KEYS.findIndex(
        (shortcutKey) => shortcutKey === key,
      );
      const sample = samples[sampleIndex];

      if (!sample || !getLaunchpadShortcutForIndex(sampleIndex)) {
        return;
      }

      event.preventDefault();
      launchSample(sample.id);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [launchSample, samples]);

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

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
