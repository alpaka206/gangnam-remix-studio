import { beforeEach, describe, expect, it } from "vitest";

import { STUDIO_STORAGE_KEY, useStudioStore } from "@/store/studioStore";

describe("studio store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStudioStore.getState().resetProject();
  });

  it("starts with op.mp3 as the only bundled audio source", () => {
    const state = useStudioStore.getState();

    expect(state.mainTrack.fileName).toBe("op.mp3");
    expect(state.mainTrack.objectUrl).toBe("/op.mp3");
    expect(state.samples).toHaveLength(1);
    expect(state.samples[0]).toMatchObject({
      fileName: "op.mp3",
      kind: "bundled",
      objectUrl: "/op.mp3",
    });
    expect(state.clips).toHaveLength(0);
  });

  it("can add the bundled op.mp3 source repeatedly", () => {
    const firstClipId = useStudioStore.getState().addSampleClip("bundled-op");
    const secondClipId = useStudioStore
      .getState()
      .addSampleClip("bundled-op", { start: 2 });

    const state = useStudioStore.getState();

    expect(firstClipId).toBeTruthy();
    expect(secondClipId).toBeTruthy();
    expect(state.clips).toHaveLength(2);
    expect(state.clips.map((clip) => clip.sampleId)).toEqual([
      "bundled-op",
      "bundled-op",
    ]);
  });

  it("adds a sample clip and selects it", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-sfx");
    const state = useStudioStore.getState();

    expect(clipId).toBeTruthy();
    expect(state.selectedClipId).toBe(clipId);
    expect(state.clips.some((clip) => clip.id === clipId)).toBe(true);
  });

  it("moves, updates, and deletes clips", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-sfx");

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
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-sfx");

    useStudioStore.getState().setBpm(128);
    useStudioStore.getState().setSpeed(1.25);
    useStudioStore.getState().saveProject();

    const stored = localStorage.getItem(STUDIO_STORAGE_KEY);

    expect(stored).toContain('"bpm":128');
    expect(stored).toContain('"speed":1.25');
    expect(stored).toContain(clipId ?? "");
  });

  it("duplicates a selected clip at a requested position", () => {
    const clipId = useStudioStore.getState().addSampleClip("bundled-op");
    const duplicatedClipId = useStudioStore
      .getState()
      .duplicateClip(clipId!, { start: 3 });

    const duplicatedClip = useStudioStore
      .getState()
      .clips.find((clip) => clip.id === duplicatedClipId);

    expect(duplicatedClip?.sampleId).toBe("bundled-op");
    expect(duplicatedClip?.start).toBeGreaterThanOrEqual(0);
  });
});

function addUploadedSample() {
  useStudioStore.getState().addUploadedSamples([
    {
      id: "uploaded-sfx",
      name: "Uploaded SFX",
      fileName: "uploaded-sfx.wav",
      duration: 1,
      objectUrl: "blob:test",
    },
  ]);
}
