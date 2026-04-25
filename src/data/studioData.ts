import type {
  MainTrackState,
  SampleItem,
  TrackDefinition,
} from "@/types/studio";

export const DEFAULT_MAIN_AUDIO_URL = "/op.mp3";
export const DEFAULT_MAIN_AUDIO_FILE_NAME = "op.mp3";

export const defaultMainTrack: MainTrackState = {
  fileName: DEFAULT_MAIN_AUDIO_FILE_NAME,
  objectUrl: DEFAULT_MAIN_AUDIO_URL,
  duration: 0,
  status: "ready",
};

export const trackDefinitions: TrackDefinition[] = [
  { id: "main", name: "Main Music", color: "#9ca3af" },
  { id: "drums", name: "Drums", color: "#f59e0b" },
  { id: "bass", name: "Bass", color: "#14b8a6" },
  { id: "synth", name: "Synth", color: "#60a5fa" },
  { id: "brass", name: "Brass", color: "#f97316" },
  { id: "sfx", name: "SFX", color: "#e879f9" },
];

export const initialSamples: SampleItem[] = [];
