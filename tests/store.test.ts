import { beforeEach, describe, expect, it } from "vitest";

import { STUDIO_STORAGE_KEY, useStudioStore } from "@/store/studioStore";

describe("studio store", () => {
  beforeEach(() => {
    localStorage.clear();
    useStudioStore.getState().resetProject();
  });

  it("starts with no main music and no preloaded sounds", () => {
    const state = useStudioStore.getState();

    expect(state.mainTrack.fileName).toBeNull();
    expect(state.mainTrack.objectUrl).toBeNull();
    expect(state.samples).toHaveLength(0);
    expect(state.clips).toHaveLength(0);
  });

  it("does not allow the bundled op.mp3 sound to become the main track", () => {
    useStudioStore.getState().setMainTrack({
      fileName: "op.mp3",
      objectUrl: "/op.mp3",
      duration: 10,
      status: "ready",
    });

    const state = useStudioStore.getState();

    expect(state.mainTrack.fileName).toBeNull();
    expect(state.mainTrack.objectUrl).toBeNull();
    expect(state.mainTrack.status).toBe("empty");
  });

  it("does not add bundled sounds unless the user uploads a source", () => {
    const clipId = useStudioStore.getState().addSampleClip("bundled-op");

    const state = useStudioStore.getState();

    expect(clipId).toBeNull();
    expect(state.clips).toHaveLength(0);
  });

  it("purges bundled op.mp3 state left by older versions", () => {
    useStudioStore.getState().addUploadedSamples([
      {
        id: "bundled-op",
        name: "op",
        fileName: "op.mp3",
        duration: 1,
        objectUrl: "/op.mp3",
      },
    ]);
    const clipId = useStudioStore.getState().addSampleClip("bundled-op");

    expect(clipId).toBeTruthy();

    useStudioStore.getState().purgeBundledSampleState();

    const state = useStudioStore.getState();

    expect(state.samples.some((sample) => sample.id === "bundled-op")).toBe(
      false,
    );
    expect(state.clips.some((clip) => clip.sampleId === "bundled-op")).toBe(
      false,
    );
  });

  it("does not use the main music length as a fallback for sound blocks", () => {
    addUploadedSample();
    useStudioStore.getState().setMainTrack({
      fileName: "main.wav",
      objectUrl: "blob:main",
      duration: 60,
      status: "ready",
    });

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");
    const clip = useStudioStore
      .getState()
      .clips.find((item) => item.id === clipId);

    expect(clip?.duration).toBe(1);
  });

  it("resizes existing sound blocks when late audio duration metadata arrives", () => {
    useStudioStore.getState().addUploadedSamples([
      {
        id: "pending-meme",
        name: "Pending Meme",
        fileName: "pending-meme.wav",
        duration: 0,
        objectUrl: "blob:pending",
      },
    ]);

    const clipId = useStudioStore.getState().addSampleClip("pending-meme");

    useStudioStore.getState().updateSampleDuration("pending-meme", 4.2);

    const clip = useStudioStore
      .getState()
      .clips.find((item) => item.id === clipId);

    expect(clip?.duration).toBe(4.2);
  });

  it("keeps manually resized sound blocks when source metadata changes", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");

    useStudioStore.getState().updateClip(clipId!, { duration: 3.5 });
    useStudioStore.getState().updateSampleDuration("uploaded-meme", 2);

    const clip = useStudioStore
      .getState()
      .clips.find((item) => item.id === clipId);

    expect(clip?.duration).toBe(3.5);
  });

  it("adds a sample clip and selects it", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");
    const state = useStudioStore.getState();

    expect(clipId).toBeTruthy();
    expect(state.selectedClipId).toBe(clipId);
    expect(state.clips.some((clip) => clip.id === clipId)).toBe(true);
  });

  it("moves, updates, and deletes clips", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");

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

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");

    useStudioStore.getState().setBpm(128);
    useStudioStore.getState().setSpeed(1.25);
    useStudioStore.getState().saveProject();

    const stored = localStorage.getItem(STUDIO_STORAGE_KEY);

    expect(stored).toContain('"bpm":128');
    expect(stored).toContain('"speed":1.25');
    expect(stored).toContain(clipId ?? "");
  });

  it("duplicates a selected clip at a requested position", () => {
    addUploadedSample();

    const clipId = useStudioStore.getState().addSampleClip("uploaded-meme");
    const duplicatedClipId = useStudioStore
      .getState()
      .duplicateClip(clipId!, { start: 3 });

    const duplicatedClip = useStudioStore
      .getState()
      .clips.find((clip) => clip.id === duplicatedClipId);

    expect(duplicatedClip?.sampleId).toBe("uploaded-meme");
    expect(duplicatedClip?.start).toBeGreaterThanOrEqual(0);
  });

  it("can place a sound at an unsnapped timeline position", () => {
    addUploadedSample();

    const clipId = useStudioStore
      .getState()
      .addSampleClip("uploaded-meme", { start: 1.37, snap: false });

    const clip = useStudioStore
      .getState()
      .clips.find((item) => item.id === clipId);

    expect(clip?.start).toBe(1.37);
  });
});

function addUploadedSample() {
  useStudioStore.getState().addUploadedSamples([
    {
      id: "uploaded-meme",
      name: "Uploaded Meme",
      fileName: "uploaded-meme.wav",
      duration: 1,
      objectUrl: "blob:test",
    },
  ]);
}
