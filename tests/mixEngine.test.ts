import { describe, expect, it } from "vitest";

import { getClipPlaybackTiming } from "@/lib/audio/mixEngine";

describe("mix engine clip timing", () => {
  it("fits non-looping audio to the visual sound block length", () => {
    expect(
      getClipPlaybackTiming({
        bufferDuration: 2,
        clipDuration: 4,
        isLooping: false,
        playedTimelineOffset: 0,
        speed: 1,
      }),
    ).toMatchObject({
      playbackRate: 0.5,
      sourceOffset: 0,
    });
  });

  it("maps mid-block playback into the matching source offset", () => {
    expect(
      getClipPlaybackTiming({
        bufferDuration: 2,
        clipDuration: 4,
        isLooping: false,
        playedTimelineOffset: 2,
        speed: 1.25,
      }),
    ).toMatchObject({
      playbackRate: 0.625,
      sourceOffset: 1,
    });
  });

  it("keeps looping sounds at the global speed and wraps offset", () => {
    expect(
      getClipPlaybackTiming({
        bufferDuration: 2,
        clipDuration: 8,
        isLooping: true,
        playedTimelineOffset: 5,
        speed: 1.5,
      }),
    ).toMatchObject({
      playbackRate: 1.5,
      sourceOffset: 1,
    });
  });
});
