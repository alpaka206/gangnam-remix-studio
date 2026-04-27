import type { SampleItem, TrackDefinition } from "@/types/studio";

export const trackDefinitions: TrackDefinition[] = [
  { id: "main", name: "Main Music", color: "#9ca3af" },
  { id: "drums", name: "Drums", color: "#f59e0b" },
  { id: "bass", name: "Bass", color: "#14b8a6" },
  { id: "synth", name: "Synth", color: "#60a5fa" },
  { id: "brass", name: "Brass", color: "#f97316" },
  { id: "sfx", name: "SFX", color: "#e879f9" },
];

export const mockSamples: SampleItem[] = [
  {
    id: "mock-kick-fill",
    name: "Kick Fill",
    kind: "mock",
    trackId: "drums",
    duration: 1.5,
    color: "#f59e0b",
  },
  {
    id: "mock-clap-hit",
    name: "Clap Hit",
    kind: "mock",
    trackId: "drums",
    duration: 0.6,
    color: "#fbbf24",
  },
  {
    id: "mock-brass-stab",
    name: "Brass Stab",
    kind: "mock",
    trackId: "brass",
    duration: 0.9,
    color: "#fb923c",
  },
  {
    id: "mock-crowd-shout",
    name: "Crowd Shout",
    kind: "mock",
    trackId: "sfx",
    duration: 1.8,
    color: "#e879f9",
  },
  {
    id: "mock-sweep-up",
    name: "Sweep Up",
    kind: "mock",
    trackId: "sfx",
    duration: 2.4,
    color: "#a78bfa",
  },
  {
    id: "mock-impact",
    name: "Impact",
    kind: "mock",
    trackId: "sfx",
    duration: 1.2,
    color: "#f43f5e",
  },
  {
    id: "mock-synth-hit",
    name: "Synth Hit",
    kind: "mock",
    trackId: "synth",
    duration: 0.8,
    color: "#60a5fa",
  },
];
