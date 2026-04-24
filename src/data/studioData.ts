import type { MainTrackState, SampleItem } from "@/types/studio";

export const BUNDLED_SAMPLE_AUDIO_URL = "/op.mp3";
export const BUNDLED_SAMPLE_AUDIO_FILE_NAME = "op.mp3";

export const defaultMainTrack: MainTrackState = {
  fileName: null,
  objectUrl: null,
  duration: 0,
  status: "empty",
};

export const DEFAULT_BUNDLED_SAMPLE_ID = "bundled-op";

export const initialSamples: SampleItem[] = [
  {
    id: DEFAULT_BUNDLED_SAMPLE_ID,
    name: "op",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#e879f9",
    fileName: BUNDLED_SAMPLE_AUDIO_FILE_NAME,
    objectUrl: BUNDLED_SAMPLE_AUDIO_URL,
  },
];
