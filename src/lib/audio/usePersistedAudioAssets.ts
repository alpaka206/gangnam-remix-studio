"use client";

import { useEffect } from "react";

import { DEFAULT_MAIN_AUDIO_URL } from "@/data/studioData";
import { MAIN_AUDIO_ASSET_ID, registerAudioAsset } from "@/lib/audio/assets";
import { getAudioUrlDuration } from "@/lib/audio/files";
import { loadPersistentAudioAsset } from "@/lib/audio/persistentAssets";
import { useStudioStore } from "@/store/studioStore";

export function usePersistedAudioAssets() {
  const mainTrack = useStudioStore((state) => state.mainTrack);
  const samples = useStudioStore((state) => state.samples);
  const setMainTrack = useStudioStore((state) => state.setMainTrack);
  const restoreSampleAsset = useStudioStore(
    (state) => state.restoreSampleAsset,
  );
  const updateSampleDuration = useStudioStore(
    (state) => state.updateSampleDuration,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBundledMainMetadata() {
      if (
        mainTrack.objectUrl !== DEFAULT_MAIN_AUDIO_URL ||
        mainTrack.duration > 0
      ) {
        return;
      }

      const duration = await getAudioUrlDuration(DEFAULT_MAIN_AUDIO_URL);

      if (duration > 0 && !cancelled) {
        setMainTrack({ ...mainTrack, duration, status: "ready" });
      }
    }

    loadBundledMainMetadata();

    return () => {
      cancelled = true;
    };
  }, [mainTrack, setMainTrack]);

  useEffect(() => {
    let cancelled = false;

    async function loadBundledSampleMetadata() {
      await Promise.all(
        samples
          .filter(
            (sample) =>
              sample.kind === "bundled" &&
              Boolean(sample.objectUrl) &&
              sample.duration <= 0,
          )
          .map(async (sample) => {
            const duration = await getAudioUrlDuration(sample.objectUrl ?? "");

            if (duration > 0 && !cancelled) {
              updateSampleDuration(sample.id, duration);
            }
          }),
      );
    }

    loadBundledSampleMetadata();

    return () => {
      cancelled = true;
    };
  }, [samples, updateSampleDuration]);

  useEffect(() => {
    let cancelled = false;

    async function restoreMainTrack() {
      if (!mainTrack.fileName || mainTrack.objectUrl) {
        return;
      }

      const file = await loadPersistentAudioAsset(MAIN_AUDIO_ASSET_ID);

      if (!file || cancelled) {
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      registerAudioAsset(MAIN_AUDIO_ASSET_ID, file, objectUrl);
      setMainTrack({
        ...mainTrack,
        fileName: file.name,
        objectUrl,
        status: "ready",
      });
    }

    restoreMainTrack();

    return () => {
      cancelled = true;
    };
  }, [mainTrack, setMainTrack]);

  useEffect(() => {
    let cancelled = false;

    async function restoreUploadedSamples() {
      const staleSamples = samples.filter(
        (sample) => sample.kind === "uploaded" && !sample.objectUrl,
      );

      await Promise.all(
        staleSamples.map(async (sample) => {
          const file = await loadPersistentAudioAsset(sample.id);

          if (!file || cancelled) {
            return;
          }

          const objectUrl = URL.createObjectURL(file);
          registerAudioAsset(sample.id, file, objectUrl);
          restoreSampleAsset(sample.id, objectUrl);
        }),
      );
    }

    restoreUploadedSamples();

    return () => {
      cancelled = true;
    };
  }, [restoreSampleAsset, samples]);
}
