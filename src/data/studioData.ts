import type { MainTrackState, SampleItem } from "@/types/studio";

export const LAUNCHPAD_SHORTCUT_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
] as const;

export const defaultMainTrack: MainTrackState = {
  fileName: null,
  objectUrl: null,
  duration: 0,
  status: "empty",
};

export const DEFAULT_BUNDLED_SAMPLE_ID = "bundled-1";

export const STUDIO_PROJECT_VERSION = 3;

export const initialSamples: SampleItem[] = [
  {
    id: "bundled-1",
    name: "옵",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#e879f9",
    fileName: "1.mp3",
    objectUrl: "/1.mp3",
  },
  {
    id: "bundled-2",
    name: "여짜",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#fb7185",
    fileName: "2.mp3",
    objectUrl: "/2.mp3",
  },
  {
    id: "bundled-3",
    name: "ㅔㅔㅔㅔ",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#f97316",
    fileName: "3.mp3",
    objectUrl: "/3.mp3",
  },
  {
    id: "bundled-4",
    name: "인간",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#facc15",
    fileName: "4.mp3",
    objectUrl: "/4.mp3",
  },
  {
    id: "bundled-5",
    name: "💩",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#84cc16",
    fileName: "5.mp3",
    objectUrl: "/5.mp3",
  },
  {
    id: "bundled-6",
    name: "앙",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#22c55e",
    fileName: "6.mp3",
    objectUrl: "/6.mp3",
  },
  {
    id: "bundled-7",
    name: "헤이",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#14b8a6",
    fileName: "7.mp3",
    objectUrl: "/7.mp3",
  },
  {
    id: "bundled-8",
    name: "떼앰 걸",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#06b6d4",
    fileName: "8.mp3",
    objectUrl: "/8.mp3",
  },
  {
    id: "bundled-9",
    name: "강남",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#38bdf8",
    fileName: "9.mp3",
    objectUrl: "/9.mp3",
  },
  {
    id: "bundled-10",
    name: "부드럽게",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#60a5fa",
    fileName: "10.mp3",
    objectUrl: "/10.mp3",
  },
  {
    id: "bundled-11",
    name: "싸나이",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#818cf8",
    fileName: "11.mp3",
    objectUrl: "/11.mp3",
  },
  {
    id: "bundled-12",
    name: "완쩐",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#a78bfa",
    fileName: "12.mp3",
    objectUrl: "/12.mp3",
  },
  {
    id: "bundled-13",
    name: "낮에는 따사",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#c084fc",
    fileName: "13.mp3",
    objectUrl: "/13.mp3",
  },
  {
    id: "bundled-14",
    name: "머리푸는",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#d946ef",
    fileName: "14.mp3",
    objectUrl: "/14.mp3",
  },
  {
    id: "bundled-15",
    name: "올통볼통",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#f472b6",
    fileName: "15.mp3",
    objectUrl: "/15.mp3",
  },
  {
    id: "bundled-16",
    name: "오빠달린다",
    kind: "bundled",
    trackId: "clips",
    duration: 0,
    color: "#f43f5e",
    fileName: "16.mp3",
    objectUrl: "/16.mp3",
  },
];

export const BUNDLED_SAMPLE_AUDIO_URLS = new Set(
  initialSamples
    .map((sample) => sample.objectUrl)
    .filter((url): url is string => Boolean(url)),
);

export const BUNDLED_SAMPLE_AUDIO_FILE_NAMES = new Set(
  initialSamples
    .map((sample) => sample.fileName)
    .filter((fileName): fileName is string => Boolean(fileName)),
);

export function getLaunchpadShortcutForIndex(index: number) {
  return LAUNCHPAD_SHORTCUT_KEYS[index] ?? null;
}
