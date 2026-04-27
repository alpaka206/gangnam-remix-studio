import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mockSamples } from "@/data/mockSamples";
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

export const STUDIO_STORAGE_KEY = "gangnam-remix-studio-project";

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
    mainTrack: {
      fileName: null,
      objectUrl: null,
      duration: 0,
      status: "empty",
    },
    clips: createInitialClips(),
    samples: cloneSamples(mockSamples),
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
          samples: [...cloneSamples(mockSamples), ...uploadedSamples],
          clips: restored.clips ?? currentState.clips,
          selectedClipId: restored.selectedClipId ?? null,
          isPlaying: false,
          exportStatus: "idle",
          exportError: null,
        };
      },
    },
  ),
);

function createInitialClips(): StudioClip[] {
  return [
    {
      id: "clip-mock-kick-fill",
      name: "Kick Fill",
      trackId: "drums",
      sampleId: "mock-kick-fill",
      sourceKind: "mock",
      start: 1.8,
      duration: 1.5,
      volume: 0.88,
      loop: false,
      color: "#f59e0b",
    },
    {
      id: "clip-mock-brass-stab",
      name: "Brass Stab",
      trackId: "brass",
      sampleId: "mock-brass-stab",
      sourceKind: "mock",
      start: 5.45,
      duration: 0.9,
      volume: 0.82,
      loop: false,
      color: "#fb923c",
    },
    {
      id: "clip-mock-synth-hit",
      name: "Synth Hit",
      trackId: "synth",
      sampleId: "mock-synth-hit",
      sourceKind: "mock",
      start: 8.2,
      duration: 0.8,
      volume: 0.76,
      loop: true,
      color: "#60a5fa",
    },
    {
      id: "clip-mock-crowd-shout",
      name: "Crowd Shout",
      trackId: "sfx",
      sampleId: "mock-crowd-shout",
      sourceKind: "mock",
      start: 12.7,
      duration: 1.8,
      volume: 0.74,
      loop: false,
      color: "#e879f9",
    },
  ];
}

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
    return createInitialStudioState().mainTrack;
  }

  return {
    ...track,
    objectUrl: null,
    status: track.fileName ? "stale" : "empty",
  };
}

function sanitizeSampleForStorage(sample: SampleItem): SampleItem {
  return {
    ...sample,
    objectUrl: null,
  };
}

const createId = createStudioId;
