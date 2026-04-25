import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { defaultMainTrack, initialSamples } from "@/data/studioData";
import { createStudioId } from "@/lib/id";
import { clampBpm, snapTimeToBeat } from "@/lib/timeline/time";
import type {
  MainTrackState,
  PlaybackSpeed,
  ExportStatus,
  SampleItem,
  StudioClip,
  StudioProjectState,
} from "@/types/studio";

export const STUDIO_STORAGE_KEY = "gangnam-remix-studio-op-only-project";

type UploadedSampleInput = {
  id: string;
  name: string;
  fileName: string;
  duration: number;
  objectUrl: string | null;
};

type StudioActions = {
  setBpm: (bpm: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setSnapToBeat: (enabled: boolean) => void;
  setMainTrack: (track: MainTrackState) => void;
  addUploadedSamples: (samples: UploadedSampleInput[]) => void;
  restoreSampleAsset: (sampleId: string, objectUrl: string) => void;
  addSampleClip: (sampleId: string) => string | null;
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
          mainTrack: {
            ...track,
            duration: Math.max(0, track.duration),
            status: track.objectUrl ? "ready" : track.status,
          },
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
              trackId: "sfx",
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
      addSampleClip: (sampleId) => {
        const state = get();
        const sample = state.samples.find((item) => item.id === sampleId);

        if (!sample) {
          return null;
        }

        const start = snapTimeToBeat(
          state.playheadTime,
          state.bpm,
          state.snapToBeat,
        );
        const clip: StudioClip = {
          id: createId("clip"),
          name: sample.name,
          trackId: sample.trackId,
          sampleId: sample.id,
          sourceKind: sample.kind,
          start,
          duration: sample.duration,
          volume: 0.86,
          loop: false,
          color: sample.color,
          fileName: sample.fileName,
        };

        set((current) => ({
          clips: [...current.clips, clip],
          selectedClipId: clip.id,
        }));

        return clip.id;
      },
      selectClip: (clipId) => set({ selectedClipId: clipId }),
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
        clips: state.clips,
        samples: state.samples.map(sanitizeSampleForStorage),
        selectedClipId: state.selectedClipId,
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
          ...restored,
          mainTrack: restoreMainTrack(restored.mainTrack),
          samples: [...cloneSamples(initialSamples), ...uploadedSamples],
          clips: filterUploadedClips(restored.clips ?? currentState.clips),
          selectedClipId: restored.selectedClipId ?? null,
          isPlaying: false,
          exportStatus: "idle",
          exportError: null,
        };
      },
    },
  ),
);

function cloneSamples(samples: SampleItem[]) {
  return samples.map((sample) => ({ ...sample }));
}

function sanitizeMainTrackForStorage(track: MainTrackState): MainTrackState {
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

  if (!track.fileName || track.fileName === defaultMainTrack.fileName) {
    return { ...defaultMainTrack, duration: track.duration || 0 };
  }

  return {
    ...track,
    objectUrl: null,
    status: track.fileName ? "stale" : "empty",
  };
}

function filterUploadedClips(clips: StudioClip[]) {
  return clips.filter((clip) => clip.sourceKind === "uploaded");
}

function sanitizeSampleForStorage(sample: SampleItem): SampleItem {
  return {
    ...sample,
    objectUrl: null,
  };
}

const createId = createStudioId;
