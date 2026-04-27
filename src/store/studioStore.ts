import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  BUNDLED_SAMPLE_AUDIO_FILE_NAME,
  BUNDLED_SAMPLE_AUDIO_URL,
  DEFAULT_BUNDLED_SAMPLE_ID,
  defaultMainTrack,
  initialSamples,
} from "@/data/studioData";
import { createStudioId } from "@/lib/id";
import { clampBpm, snapTimeToBeat } from "@/lib/timeline/time";
import type {
  MainTrackState,
  PlaybackSpeed,
  ExportStatus,
  SampleItem,
  StudioClip,
  StudioProjectState,
  UploadedSampleInput,
} from "@/types/studio";

export const STUDIO_STORAGE_KEY = "gangnam-remix-studio-op-only-project";

type StudioActions = {
  setBpm: (bpm: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setSnapToBeat: (enabled: boolean) => void;
  setMainTrack: (track: MainTrackState) => void;
  addUploadedSamples: (samples: UploadedSampleInput[]) => void;
  restoreSampleAsset: (sampleId: string, objectUrl: string) => void;
  updateSampleDuration: (sampleId: string, duration: number) => void;
  purgeBundledSampleState: () => void;
  selectSample: (sampleId: string | null) => void;
  addSampleClip: (
    sampleId: string,
    options?: { start?: number; snap?: boolean },
  ) => string | null;
  duplicateClip: (
    clipId: string,
    options?: { start?: number; snap?: boolean },
  ) => string | null;
  selectClip: (clipId: string | null) => void;
  moveClip: (clipId: string, start: number) => void;
  updateClip: (clipId: string, patch: Partial<StudioClip>) => void;
  deleteClip: (clipId: string) => void;
  setPlayheadTime: (time: number) => void;
  setPlayback: (isPlaying: boolean) => void;
  saveProject: () => void;
  setExportStatus: (status: ExportStatus) => void;
  setExportError: (message: string | null) => void;
  resetProject: () => void;
};

export type StudioStore = StudioProjectState & StudioActions;

const uploadedSampleColors = ["#e879f9", "#22c55e", "#38bdf8", "#fb7185"];

export function createInitialStudioState(): StudioProjectState {
  return {
    bpm: 132,
    speed: 1,
    snapToBeat: true,
    mainTrack: { ...defaultMainTrack },
    clips: [],
    samples: cloneSamples(initialSamples),
    selectedClipId: null,
    selectedSampleId: null,
    playheadTime: 0,
    isPlaying: false,
    exportStatus: "idle",
    exportError: null,
    lastSavedAt: null,
  };
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      ...createInitialStudioState(),
      setBpm: (bpm) => set({ bpm: clampBpm(bpm) }),
      setSpeed: (speed) => set({ speed }),
      setSnapToBeat: (enabled) => set({ snapToBeat: enabled }),
      setMainTrack: (track) =>
        set({
          mainTrack: normalizeMainTrack(track),
        }),
      addUploadedSamples: (samples) =>
        set((state) => {
          const createdSamples = samples.map((sample, index): SampleItem => {
            const color =
              uploadedSampleColors[
                (state.samples.length + index) % uploadedSampleColors.length
              ];

            return {
              id: sample.id,
              name: sample.name,
              kind: "uploaded",
              trackId: "clips",
              duration: Math.max(0.5, sample.duration || 1.5),
              color,
              fileName: sample.fileName,
              objectUrl: sample.objectUrl,
            };
          });

          return { samples: [...state.samples, ...createdSamples] };
        }),
      restoreSampleAsset: (sampleId, objectUrl) =>
        set((state) => ({
          samples: state.samples.map((sample) =>
            sample.id === sampleId ? { ...sample, objectUrl } : sample,
          ),
        })),
      updateSampleDuration: (sampleId, duration) =>
        set((state) => {
          const previousSample = state.samples.find(
            (sample) => sample.id === sampleId,
          );
          const previousDuration = previousSample?.duration ?? 0;
          const nextDuration = Math.max(0, duration);

          return {
            samples: state.samples.map((sample) =>
              sample.id === sampleId
                ? { ...sample, duration: nextDuration }
                : sample,
            ),
            clips: state.clips.map((clip) => {
              if (clip.sampleId !== sampleId || nextDuration <= 0) {
                return clip;
              }

              const shouldFollowSourceDuration =
                previousDuration <= 0 ||
                Math.abs(clip.duration - previousDuration) < 0.01;

              return shouldFollowSourceDuration
                ? { ...clip, duration: Math.max(0.25, nextDuration) }
                : clip;
            }),
          };
        }),
      purgeBundledSampleState: () =>
        set((state) => ({
          samples: state.samples.filter(
            (sample) => sample.id !== DEFAULT_BUNDLED_SAMPLE_ID,
          ),
          clips: state.clips.filter(
            (clip) => clip.sampleId !== DEFAULT_BUNDLED_SAMPLE_ID,
          ),
          selectedSampleId:
            state.selectedSampleId === DEFAULT_BUNDLED_SAMPLE_ID
              ? null
              : state.selectedSampleId,
          selectedClipId:
            state.clips.find((clip) => clip.id === state.selectedClipId)
              ?.sampleId === DEFAULT_BUNDLED_SAMPLE_ID
              ? null
              : state.selectedClipId,
        })),
      selectSample: (sampleId) =>
        set({ selectedSampleId: sampleId, selectedClipId: null }),
      addSampleClip: (sampleId, options) => {
        const state = get();
        const sample = state.samples.find((item) => item.id === sampleId);

        if (!sample) {
          return null;
        }

        const start = resolveClipStart(
          options?.start ?? state.playheadTime,
          state.bpm,
          options?.snap ?? state.snapToBeat,
        );
        const duration = Math.max(0.25, sample.duration || 1);
        const clip: StudioClip = {
          id: createId("clip"),
          name: sample.name,
          trackId: sample.trackId,
          sampleId: sample.id,
          sourceKind: sample.kind,
          start,
          duration,
          volume: 0.86,
          loop: false,
          color: sample.color,
          fileName: sample.fileName,
        };

        set((current) => ({
          clips: [...current.clips, clip],
          selectedClipId: clip.id,
          selectedSampleId: sample.id,
        }));

        return clip.id;
      },
      duplicateClip: (clipId, options) => {
        const state = get();
        const sourceClip = state.clips.find((clip) => clip.id === clipId);

        if (!sourceClip) {
          return null;
        }

        const start = resolveClipStart(
          options?.start ?? sourceClip.start + sourceClip.duration,
          state.bpm,
          options?.snap ?? state.snapToBeat,
        );
        const clip: StudioClip = {
          ...sourceClip,
          id: createId("clip"),
          start,
          trackId: "clips",
        };

        set((current) => ({
          clips: [...current.clips, clip],
          selectedClipId: clip.id,
          selectedSampleId: clip.sampleId ?? null,
        }));

        return clip.id;
      },
      selectClip: (clipId) =>
        set((state) => ({
          selectedClipId: clipId,
          selectedSampleId:
            state.clips.find((clip) => clip.id === clipId)?.sampleId ?? null,
        })),
      moveClip: (clipId, start) =>
        set((state) => ({
          clips: state.clips.map((clip) =>
            clip.id === clipId
              ? {
                  ...clip,
                  start: snapTimeToBeat(start, state.bpm, state.snapToBeat),
                }
              : clip,
          ),
        })),
      updateClip: (clipId, patch) =>
        set((state) => ({
          clips: state.clips.map((clip) =>
            clip.id === clipId
              ? {
                  ...clip,
                  ...patch,
                  start:
                    patch.start === undefined
                      ? clip.start
                      : Math.max(0, patch.start),
                  duration:
                    patch.duration === undefined
                      ? clip.duration
                      : Math.max(0.1, patch.duration),
                  volume:
                    patch.volume === undefined
                      ? clip.volume
                      : Math.min(1, Math.max(0, patch.volume)),
                }
              : clip,
          ),
        })),
      deleteClip: (clipId) =>
        set((state) => ({
          clips: state.clips.filter((clip) => clip.id !== clipId),
          selectedClipId:
            state.selectedClipId === clipId ? null : state.selectedClipId,
        })),
      setPlayheadTime: (time) => set({ playheadTime: Math.max(0, time) }),
      setPlayback: (isPlaying) => set({ isPlaying }),
      saveProject: () =>
        set({ lastSavedAt: new Date().toISOString(), exportStatus: "idle" }),
      setExportStatus: (status) => set({ exportStatus: status }),
      setExportError: (message) => set({ exportError: message }),
      resetProject: () => set(createInitialStudioState()),
    }),
    {
      name: STUDIO_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): StudioProjectState => ({
        bpm: state.bpm,
        speed: state.speed,
        snapToBeat: state.snapToBeat,
        mainTrack: sanitizeMainTrackForStorage(state.mainTrack),
        clips: state.clips.filter(
          (clip) => clip.sampleId !== DEFAULT_BUNDLED_SAMPLE_ID,
        ),
        samples: state.samples
          .filter((sample) => sample.id !== DEFAULT_BUNDLED_SAMPLE_ID)
          .map(sanitizeSampleForStorage),
        selectedClipId: state.selectedClipId,
        selectedSampleId: state.selectedSampleId,
        playheadTime: state.playheadTime,
        isPlaying: false,
        exportStatus: "idle",
        exportError: null,
        lastSavedAt: state.lastSavedAt,
      }),
      merge: (persistedState, currentState) => {
        const restored = persistedState as Partial<StudioProjectState>;
        const uploadedSamples = (restored.samples ?? [])
          .filter((sample) => sample.kind === "uploaded")
          .map(sanitizeSampleForStorage);

        return {
          ...currentState,
          bpm: restored.bpm ?? currentState.bpm,
          speed: restored.speed ?? currentState.speed,
          snapToBeat: restored.snapToBeat ?? currentState.snapToBeat,
          mainTrack: restoreMainTrack(restored.mainTrack),
          samples: [...cloneSamples(initialSamples), ...uploadedSamples],
          clips: filterRestoredClips(
            restored.clips ?? currentState.clips,
            uploadedSamples,
          ),
          selectedClipId: restored.selectedClipId ?? null,
          selectedSampleId: restored.selectedSampleId ?? null,
          playheadTime: restored.playheadTime ?? currentState.playheadTime,
          isPlaying: false,
          exportStatus: "idle",
          exportError: null,
          lastSavedAt: restored.lastSavedAt ?? null,
        };
      },
    },
  ),
);

function cloneSamples(samples: SampleItem[]) {
  return samples.map((sample) => ({ ...sample }));
}

function sanitizeMainTrackForStorage(track: MainTrackState): MainTrackState {
  if (isBundledSampleTrack(track)) {
    return { ...defaultMainTrack };
  }

  return {
    ...track,
    objectUrl: null,
    status: track.fileName ? "stale" : "empty",
  };
}

function restoreMainTrack(track?: MainTrackState): MainTrackState {
  if (!track) {
    return { ...defaultMainTrack };
  }

  if (!track.fileName || isBundledSampleTrack(track)) {
    return { ...defaultMainTrack, duration: track.duration || 0 };
  }

  return {
    ...track,
    objectUrl: null,
    status: track.fileName ? "stale" : "empty",
  };
}

function normalizeMainTrack(track: MainTrackState): MainTrackState {
  if (isBundledSampleTrack(track)) {
    return { ...defaultMainTrack };
  }

  return {
    ...track,
    duration: Math.max(0, track.duration),
    status: track.objectUrl ? "ready" : track.status,
  };
}

function isBundledSampleTrack(track: MainTrackState) {
  return (
    track.fileName === BUNDLED_SAMPLE_AUDIO_FILE_NAME ||
    track.objectUrl === BUNDLED_SAMPLE_AUDIO_URL
  );
}

function filterRestoredClips(clips: StudioClip[], samples: SampleItem[]) {
  const sampleIds = new Set(samples.map((sample) => sample.id));

  return clips
    .filter(
      (clip) => clip.sourceKind === "uploaded" || clip.sourceKind === "bundled",
    )
    .filter((clip) => clip.sampleId !== DEFAULT_BUNDLED_SAMPLE_ID)
    .filter((clip) => (clip.sampleId ? sampleIds.has(clip.sampleId) : false))
    .map((clip) => ({ ...clip, trackId: "clips" as const }));
}

function sanitizeSampleForStorage(sample: SampleItem): SampleItem {
  return {
    ...sample,
    trackId: "clips",
    objectUrl: null,
  };
}

function resolveClipStart(start: number, bpm: number, shouldSnap: boolean) {
  return shouldSnap ? snapTimeToBeat(start, bpm, true) : Math.max(0, start);
}

const createId = createStudioId;
