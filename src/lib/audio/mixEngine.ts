import { MAIN_AUDIO_ASSET_ID, getAudioAssetFile } from "@/lib/audio/assets";
import { createMockSampleBuffer } from "@/lib/audio/mockBuffers";
import type {
  MainTrackState,
  SampleItem,
  StudioClip,
  TrackId,
} from "@/types/studio";

export type ScheduledMix = {
  nodes: AudioBufferSourceNode[];
  stop: () => void;
};

export type MixRenderData = {
  mainTrack: MainTrackState;
  clips: StudioClip[];
  samples: SampleItem[];
  speed: number;
};

const trackGain: Record<TrackId, number> = {
  main: 0.9,
  drums: 0.92,
  bass: 0.86,
  synth: 0.78,
  brass: 0.82,
  sfx: 0.85,
};

export async function scheduleMixPlayback({
  context,
  destination,
  mix,
  startTime,
  timelineEnd,
}: {
  context: AudioContext;
  destination: AudioNode;
  mix: MixRenderData;
  startTime: number;
  timelineEnd: number;
}): Promise<ScheduledMix> {
  const nodes = await scheduleMix({
    context,
    destination,
    mix,
    startTime,
    timelineEnd,
  });

  return {
    nodes,
    stop: () => {
      for (const node of nodes) {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
      }
    },
  };
}

export async function scheduleMix({
  context,
  destination,
  mix,
  startTime,
  timelineEnd,
}: {
  context: BaseAudioContext;
  destination: AudioNode;
  mix: MixRenderData;
  startTime: number;
  timelineEnd: number;
}) {
  const nodes: AudioBufferSourceNode[] = [];
  const speed = Math.max(0.1, mix.speed);
  const now = context.currentTime;

  const mainBuffer = await resolveMainBuffer(context, mix.mainTrack);

  if (mainBuffer && startTime < mainBuffer.duration) {
    const mainSource = createSourceNode({
      context,
      destination,
      buffer: mainBuffer,
      gainValue: trackGain.main,
      playbackRate: speed,
    });
    const remainingTimelineDuration = Math.min(
      timelineEnd - startTime,
      mainBuffer.duration - startTime,
    );

    mainSource.start(now, startTime);
    mainSource.stop(now + remainingTimelineDuration / speed);
    nodes.push(mainSource);
  }

  for (const clip of mix.clips) {
    const clipEnd = clip.start + clip.duration;

    if (clipEnd <= startTime || clip.start >= timelineEnd) {
      continue;
    }

    const sample = mix.samples.find((item) => item.id === clip.sampleId);
    const buffer = await resolveClipBuffer(context, clip, sample);

    if (!buffer) {
      continue;
    }

    const delay = Math.max(0, (clip.start - startTime) / speed);
    const playedTimelineOffset = Math.max(0, startTime - clip.start);
    const timelineDuration = Math.max(
      0,
      Math.min(clip.duration - playedTimelineOffset, timelineEnd - clip.start),
    );

    if (timelineDuration <= 0) {
      continue;
    }

    const source = createSourceNode({
      context,
      destination,
      buffer,
      gainValue: clip.volume * trackGain[clip.trackId],
      playbackRate: speed,
    });
    const sourceOffset = clip.loop
      ? playedTimelineOffset % Math.max(0.01, buffer.duration)
      : Math.min(playedTimelineOffset, Math.max(0, buffer.duration - 0.01));

    source.loop = clip.loop;
    source.start(now + delay, sourceOffset);
    source.stop(now + delay + timelineDuration / speed);
    nodes.push(source);
  }

  return nodes;
}

export function getMixTimelineEnd(mix: Pick<MixRenderData, "clips" | "mainTrack">) {
  const mainEnd = mix.mainTrack.duration;
  const clipEnd = Math.max(
    0,
    ...mix.clips.map((clip) => clip.start + clip.duration),
  );

  return Math.max(1, mainEnd, clipEnd);
}

async function resolveMainBuffer(
  context: BaseAudioContext,
  mainTrack: MainTrackState,
) {
  const file = await getAudioAssetFile(MAIN_AUDIO_ASSET_ID);

  if (!file || !mainTrack.fileName) {
    return null;
  }

  return decodeFile(context, file);
}

async function resolveClipBuffer(
  context: BaseAudioContext,
  clip: StudioClip,
  sample?: SampleItem,
) {
  if (clip.sourceKind === "mock") {
    return createMockSampleBuffer(context, {
      sampleId: clip.sampleId ?? clip.id,
      duration: clip.duration,
    });
  }

  if (!sample) {
    return null;
  }

  const file = await getAudioAssetFile(sample.id);

  if (!file) {
    return null;
  }

  return decodeFile(context, file);
}

async function decodeFile(context: BaseAudioContext, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return context.decodeAudioData(arrayBuffer.slice(0));
}

function createSourceNode({
  context,
  destination,
  buffer,
  gainValue,
  playbackRate,
}: {
  context: BaseAudioContext;
  destination: AudioNode;
  buffer: AudioBuffer;
  gainValue: number;
  playbackRate: number;
}) {
  const source = context.createBufferSource();
  const gain = context.createGain();

  source.buffer = buffer;
  source.playbackRate.value = playbackRate;
  gain.gain.value = Math.max(0, Math.min(1.2, gainValue));
  source.connect(gain);
  gain.connect(destination);

  return source;
}
