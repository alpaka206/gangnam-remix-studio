import { describe, expect, it } from "vitest";

import { encodeAudioBufferToWav } from "@/lib/audio/wav";

describe("wav encoder", () => {
  it("encodes a PCM wav header and interleaved samples", async () => {
    const left = new Float32Array([0, 0.5, -0.5, 1]);
    const right = new Float32Array([0, -0.5, 0.5, -1]);
    const audioBuffer = {
      numberOfChannels: 2,
      sampleRate: 44_100,
      length: left.length,
      getChannelData: (channel: number) => (channel === 0 ? left : right),
    } as AudioBuffer;

    const blob = encodeAudioBufferToWav(audioBuffer);
    const view = new DataView(await blob.arrayBuffer());
    const signature = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    );

    expect(blob.type).toBe("audio/wav");
    expect(signature).toBe("RIFF");
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(44_100);
    expect(view.byteLength).toBe(44 + left.length * 2 * 2);
  });
});
