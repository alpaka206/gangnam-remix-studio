"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import { useStudioStore } from "@/store/studioStore";

export function useStudioPlayback() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const frameRef = useRef<number | null>(null);
  const simulationStartedAtRef = useRef<{
    startedAt: number;
    startPlayhead: number;
  } | null>(null);
  const playheadTimeRef = useRef(0);

  const mainTrack = useStudioStore((state) => state.mainTrack);
  const speed = useStudioStore((state) => state.speed);
  const isPlaying = useStudioStore((state) => state.isPlaying);
  const playheadTime = useStudioStore((state) => state.playheadTime);
  const setPlayheadTime = useStudioStore((state) => state.setPlayheadTime);
  const setPlayback = useStudioStore((state) => state.setPlayback);

  useEffect(() => {
    playheadTimeRef.current = playheadTime;
  }, [playheadTime]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => setPlayheadTime(audio.currentTime);
    const handleEnded = () => setPlayback(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setPlayback, setPlayheadTime]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !mainTrack.objectUrl) {
      return;
    }

    audio.src = mainTrack.objectUrl;
    audio.currentTime = 0;
  }, [mainTrack.objectUrl]);

  useEffect(() => {
    if (!isPlaying || mainTrack.objectUrl) {
      cancelSimulation(frameRef);
      simulationStartedAtRef.current = null;
      return;
    }

    simulationStartedAtRef.current = {
      startedAt: performance.now(),
      startPlayhead: playheadTimeRef.current,
    };

    const tick = () => {
      const simulation = simulationStartedAtRef.current;

      if (simulation === null) {
        return;
      }

      const elapsed =
        simulation.startPlayhead +
        ((performance.now() - simulation.startedAt) / 1000) * speed;
      setPlayheadTime(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => cancelSimulation(frameRef);
  }, [isPlaying, mainTrack.objectUrl, setPlayheadTime, speed]);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;

    if (isPlaying) {
      audio?.pause();
      setPlayback(false);
      return;
    }

    if (!mainTrack.objectUrl || !audio) {
      setPlayback(true);
      return;
    }

    try {
      audio.playbackRate = speed;
      audio.currentTime = Math.min(
        playheadTime,
        mainTrack.duration || playheadTime,
      );
      await audio.play();
      setPlayback(true);
    } catch {
      setPlayback(false);
    }
  }, [
    isPlaying,
    mainTrack.duration,
    mainTrack.objectUrl,
    playheadTime,
    setPlayback,
    speed,
  ]);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    cancelSimulation(frameRef);
    simulationStartedAtRef.current = null;
    setPlayheadTime(0);
    setPlayback(false);
  }, [setPlayback, setPlayheadTime]);

  return {
    audioRef,
    togglePlayback,
    stopPlayback,
  };
}

function cancelSimulation(frameRef: MutableRefObject<number | null>) {
  if (frameRef.current !== null) {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }
}
