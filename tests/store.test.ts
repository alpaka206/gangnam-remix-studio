import { beforeEach, describe, expect, it } from "vitest";

import { STUDIO_STORAGE_KEY, useStudioStore } from "@/store/studioStore";

describe("studio store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStudioStore.getState().resetProject();
  });

  it("adds a sample clip and selects it", () => {
    const clipId = useStudioStore.getState().addSampleClip("mock-impact");
    const state = useStudioStore.getState();

    expect(clipId).toBeTruthy();
    expect(state.selectedClipId).toBe(clipId);
    expect(state.clips.some((clip) => clip.id === clipId)).toBe(true);
  });

  it("moves, updates, and deletes clips", () => {
    const clipId = useStudioStore.getState().addSampleClip("mock-clap-hit");

    expect(clipId).toBeTruthy();

    useStudioStore.getState().moveClip(clipId!, 2.2);
    useStudioStore.getState().updateClip(clipId!, { volume: 0.35, loop: true });

    const movedClip = useStudioStore
      .getState()
      .clips.find((clip) => clip.id === clipId);

    expect(movedClip?.start).toBeGreaterThan(0);
    expect(movedClip?.volume).toBe(0.35);
    expect(movedClip?.loop).toBe(true);

    useStudioStore.getState().deleteClip(clipId!);

    expect(
      useStudioStore.getState().clips.some((clip) => clip.id === clipId),
    ).toBe(false);
  });

  it("persists bpm, speed, and clips in localStorage", () => {
    const clipId = useStudioStore.getState().addSampleClip("mock-sweep-up");

    useStudioStore.getState().setBpm(128);
    useStudioStore.getState().setSpeed(1.25);
    useStudioStore.getState().saveProject();

    const stored = localStorage.getItem(STUDIO_STORAGE_KEY);

    expect(stored).toContain('"bpm":128');
    expect(stored).toContain('"speed":1.25');
    expect(stored).toContain(clipId ?? "");
  });
});
