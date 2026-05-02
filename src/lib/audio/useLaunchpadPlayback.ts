"use client";

import { useCallback, useEffect, useRef } from "react";

import { getAudioAssetFile } from "@/lib/audio/assets";
import type { SampleItem } from "@/types/studio";

type BrowserAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export type LaunchpadPlaybackOptions = {
  pitchSemitones: number;
  speed: number;
  volume?: number;
};

export function useLaunchpadPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const getAudioContext = useCallback(async () => {
    const AudioContextClass =
      window.AudioContext ?? (window as BrowserAudioWindow).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const triggerSample = useCallback(
    async (sample: SampleItem, options: LaunchpadPlaybackOptions) => {
      const context = await getAudioContext();

      if (!context) {
        return;
      }

      const buffer = await getSampleBuffer(
        context,
        sample,
        bufferCacheRef.current,
      );

      if (!buffer) {
        return;
      }

      const source = context.createBufferSource();
      const gain = context.createGain();
      const playbackRate = getLaunchpadPlaybackRate(options);

      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = Math.max(0, Math.min(1.2, options.volume ?? 0.95));

      source.connect(gain);
      gain.connect(context.destination);
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
        source.disconnect();
        gain.disconnect();
      };
      source.start();
    },
    [getAudioContext],
  );

  useEffect(() => {
    const activeSources = activeSourcesRef.current;
    const bufferCache = bufferCacheRef.current;

    return () => {
      for (const source of activeSources) {
        try {
          source.stop();
        } catch {
          // Already stopped.
        }
      }

      activeSources.clear();
      bufferCache.clear();

      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
    };
  }, []);

  return { triggerSample };
}

export function getLaunchpadPlaybackRate({
  pitchSemitones,
  speed,
}: LaunchpadPlaybackOptions) {
  const speedRate = Math.max(0.25, Math.min(3, speed));
  const pitchRate = Math.pow(2, pitchSemitones / 12);

  return Math.max(0.1, speedRate * pitchRate);
}

async function getSampleBuffer(
  context: BaseAudioContext,
  sample: SampleItem,
  bufferCache: Map<string, AudioBuffer>,
) {
  const cachedBuffer = bufferCache.get(sample.id);

  if (cachedBuffer) {
    return cachedBuffer;
  }

  const file =
    sample.kind === "uploaded" ? await getAudioAssetFile(sample.id) : null;
  const buffer = file
    ? await decodeFile(context, file)
    : sample.objectUrl
      ? await decodeUrl(context, sample.objectUrl)
      : null;

  if (buffer) {
    bufferCache.set(sample.id, buffer);
  }

  return buffer;
}

async function decodeFile(context: BaseAudioContext, file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return context.decodeAudioData(arrayBuffer.slice(0));
}

async function decodeUrl(context: BaseAudioContext, url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();

  return context.decodeAudioData(arrayBuffer.slice(0));
}
