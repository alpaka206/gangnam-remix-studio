export type TrackId = "main" | "clips";

export type ClipTrackId = Exclude<TrackId, "main">;

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export type SampleKind = "bundled" | "uploaded";

export type ExportStatus = "idle" | "rendering" | "ready" | "error";

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
  trackId: ClipTrackId;
  duration: number;
  color: string;
  fileName?: string;
  objectUrl?: string | null;
}

export interface StudioClip {
  id: string;
  name: string;
  trackId: ClipTrackId;
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
  selectedSampleId: string | null;
  playheadTime: number;
  isPlaying: boolean;
  exportStatus: ExportStatus;
  exportError: string | null;
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
