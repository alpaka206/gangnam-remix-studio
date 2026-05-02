"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  LAUNCHPAD_SHORTCUT_KEYS,
  getLaunchpadShortcutForIndex,
} from "@/data/studioData";
import { isEditableTarget } from "@/lib/dom";
import {
  getLaunchpadPlaybackRate,
  useLaunchpadPlayback,
} from "@/lib/audio/useLaunchpadPlayback";
import { useStudioStore } from "@/store/studioStore";

type LaunchpadControllerOptions = {
  startPlayback: () => Promise<void>;
  stopPlayback: () => void;
};

export function useLaunchpadController({
  startPlayback,
  stopPlayback,
}: LaunchpadControllerOptions) {
  const [launchpadPitchSemitones, setLaunchpadPitchSemitones] = useState(0);
  const [launchpadSpeed, setLaunchpadSpeed] = useState(1);
  const playbackStartPendingRef = useRef(false);
  const { triggerSample } = useLaunchpadPlayback();
  const samples = useStudioStore((state) => state.samples);
  const addSampleClip = useStudioStore((state) => state.addSampleClip);
  const clearEffectClips = useStudioStore((state) => state.clearEffectClips);
  const selectSample = useStudioStore((state) => state.selectSample);

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

  return {
    launchSample,
    launchpadPitchSemitones,
    launchpadSpeed,
    resetEffects,
    setLaunchpadPitchSemitones,
    setLaunchpadSpeed,
  };
}
