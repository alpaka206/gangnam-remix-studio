"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  getMixTimelineEnd,
  scheduleMixPlayback,
  type ScheduledMix,
} from "@/lib/audio/mixEngine";
import { useStudioStore } from "@/store/studioStore";

export function useStudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const scheduledMixRef = useRef<ScheduledMix | null>(null);
  const frameRef = useRef<number | null>(null);
  const playheadTimeRef = useRef(0);
  const previousSpeedRef = useRef<number | null>(null);
  const playbackStartedRef = useRef<{
    startedAt: number;
    startPlayhead: number;
    timelineEnd: number;
  } | null>(null);

  const mainTrack = useStudioStore((state) => state.mainTrack);
  const clips = useStudioStore((state) => state.clips);
  const samples = useStudioStore((state) => state.samples);
  const speed = useStudioStore((state) => state.speed);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const playheadTime = useStudioStore((state) => state.playheadTime);
  const setPlayheadTime = useStudioStore((state) => state.setPlayheadTime);
  const setPlayback = useStudioStore((state) => state.setPlayback);

  useEffect(() => {
    playheadTimeRef.current = playheadTime;
  }, [playheadTime]);

  const cancelAnimationFrameIfNeeded = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const stopScheduledMix = useCallback(() => {
    scheduledMixRef.current?.stop();
    scheduledMixRef.current = null;
    playbackStartedRef.current = null;
    cancelAnimationFrameIfNeeded();

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      void context.close();
    }
  }, [cancelAnimationFrameIfNeeded]);

  const startPlayheadLoop = useCallback(
    (
      playbackSpeed: number,
      updatePlayhead: (time: number) => void,
      updatePlayback: (playing: boolean) => void,
    ) => {
      cancelAnimationFrameIfNeeded();

      const tick = () => {
        const playback = playbackStartedRef.current;

        if (!playback) {
          return;
        }

        const elapsed =
          playback.startPlayhead +
          ((performance.now() - playback.startedAt) / 1000) * playbackSpeed;
        const boundedElapsed = Math.min(elapsed, playback.timelineEnd);

        updatePlayhead(boundedElapsed);

        if (boundedElapsed >= playback.timelineEnd) {
          stopScheduledMix();
          updatePlayback(false);
          return;
        }

        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);
    },
    [cancelAnimationFrameIfNeeded, stopScheduledMix],
  );

  useEffect(() => {
    return () => {
      stopScheduledMix();
    };
  }, [stopScheduledMix]);

  const startPlayback = useCallback(async () => {
    const AudioContextClass =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    stopScheduledMix();

    const context = new AudioContextClass();
    audioContextRef.current = context;
    await context.resume();

    const startTime = playheadTimeRef.current;
    const timelineEnd = getMixTimelineEnd({ clips, mainTrack });
    const scheduledMix = await scheduleMixPlayback({
      context,
      destination: context.destination,
      mix: { mainTrack, clips, samples, speed },
      startTime,
      timelineEnd,
    });

    scheduledMixRef.current = scheduledMix;
    playbackStartedRef.current = {
      startedAt: performance.now(),
      startPlayhead: startTime,
      timelineEnd,
    };
    setPlayback(true);
    startPlayheadLoop(speed, setPlayheadTime, setPlayback);
  }, [
    clips,
    mainTrack,
    samples,
    setPlayback,
    setPlayheadTime,
    speed,
    startPlayheadLoop,
    stopScheduledMix,
  ]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      stopScheduledMix();
      setPlayback(false);
      return;
    }

    await startPlayback();
  }, [isPlaying, setPlayback, startPlayback, stopScheduledMix]);

  useEffect(() => {
    if (previousSpeedRef.current === null) {
      previousSpeedRef.current = speed;
      return;
    }

    if (previousSpeedRef.current === speed) {
      return;
    }

    previousSpeedRef.current = speed;

    if (isPlaying) {
      void startPlayback();
    }
  }, [isPlaying, speed, startPlayback]);

  const stopPlayback = useCallback(() => {
    stopScheduledMix();
    setPlayheadTime(0);
    setPlayback(false);
  }, [setPlayback, setPlayheadTime, stopScheduledMix]);

  return {
    startPlayback,
    togglePlayback,
    stopPlayback,
  };
}
