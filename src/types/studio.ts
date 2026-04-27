export type TrackId = "main" | "drums" | "bass" | "synth" | "brass" | "sfx";

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export type SampleKind = "mock" | "uploaded";

export type ExportStatus = "idle" | "preparing";

export interface TrackDefinition {
  id: TrackId;
  name: string;
  color: string;
}

export interface MainTrackState {
  fileName: string | null;
  objectUrl: string | null;
  duration: number;
  status: "empty" | "ready" | "stale";
}

export interface SampleItem {
  id: string;
  name: string;
  kind: SampleKind;
  trackId: Exclude<TrackId, "main">;
  duration: number;
  color: string;
  fileName?: string;
  objectUrl?: string | null;
}

export interface StudioClip {
  id: string;
  name: string;
  trackId: TrackId;
  sampleId?: string;
  sourceKind: SampleKind | "main";
  start: number;
  duration: number;
  volume: number;
  loop: boolean;
  color: string;
  fileName?: string;
}

export interface StudioProjectState {
  bpm: number;
  speed: PlaybackSpeed;
  snapToBeat: boolean;
  mainTrack: MainTrackState;
  clips: StudioClip[];
  samples: SampleItem[];
  selectedClipId: string | null;
  playheadTime: number;
  isPlaying: boolean;
  exportStatus: ExportStatus;
  lastSavedAt: string | null;
}

export interface TimelineGridLine {
  id: string;
  time: number;
  x: number;
  beat: number;
  bar: number;
  isBar: boolean;
  label: string;
}
