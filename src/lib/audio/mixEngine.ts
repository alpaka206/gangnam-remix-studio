import { MAIN_AUDIO_ASSET_ID, getAudioAssetFile } from "@/lib/audio/assets";
import type {
  ClipTrackId,
  MainTrackState,
  SampleItem,
  StudioClip,
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

const mainGain = 0.9;
const trackGain: Record<ClipTrackId, number> = {
  clips: 0.85,
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
  const effectiveTimelineEnd =
    mix.mainTrack.duration > 0
      ? timelineEnd
      : Math.max(timelineEnd, mainBuffer?.duration ?? 0);

  if (mainBuffer && startTime < mainBuffer.duration) {
    const mainSource = createSourceNode({
      context,
      destination,
      buffer: mainBuffer,
      gainValue: mainGain,
      playbackRate: speed,
    });
    const remainingTimelineDuration = Math.min(
      effectiveTimelineEnd - startTime,
      mainBuffer.duration - startTime,
    );

    mainSource.start(now, startTime);
    mainSource.stop(now + remainingTimelineDuration / speed);
    nodes.push(mainSource);
  }

  for (const clip of mix.clips) {
    const clipEnd = clip.start + clip.duration;

    if (clipEnd <= startTime || clip.start >= effectiveTimelineEnd) {
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
      Math.min(
        clip.duration - playedTimelineOffset,
        effectiveTimelineEnd - clip.start,
      ),
    );

    if (timelineDuration <= 0) {
      continue;
    }

    const clipPlaybackTiming = getClipPlaybackTiming({
      bufferDuration: buffer.duration,
      clipDuration: clip.duration,
      isLooping: clip.loop,
      playedTimelineOffset,
      speed,
    });
    const source = createSourceNode({
      context,
      destination,
      buffer,
      gainValue: clip.volume * trackGain[clip.trackId],
      playbackRate: clipPlaybackTiming.playbackRate,
    });

    source.loop = clip.loop;
    source.start(now + delay, clipPlaybackTiming.sourceOffset);
    source.stop(now + delay + timelineDuration / speed);
    nodes.push(source);
  }

  return nodes;
}

export function getClipPlaybackTiming({
  bufferDuration,
  clipDuration,
  isLooping,
  playedTimelineOffset,
  speed,
}: {
  bufferDuration: number;
  clipDuration: number;
  isLooping: boolean;
  playedTimelineOffset: number;
  speed: number;
}) {
  const safeSpeed = Math.max(0.1, speed);
  const safeBufferDuration = Math.max(0.01, bufferDuration);

  if (isLooping) {
    return {
      playbackRate: safeSpeed,
      sourceOffset: Math.max(0, playedTimelineOffset) % safeBufferDuration,
    };
  }

  const safeClipDuration = Math.max(0.01, clipDuration);
  const clipFitRate = safeBufferDuration / safeClipDuration;

  return {
    playbackRate: safeSpeed * clipFitRate,
    sourceOffset: Math.min(
      Math.max(0, playedTimelineOffset) * clipFitRate,
      Math.max(0, safeBufferDuration - 0.01),
    ),
  };
}

export function getMixTimelineEnd(
  mix: Pick<MixRenderData, "clips" | "mainTrack">,
) {
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
  if (!hasMainTrackAudio(mainTrack)) {
    return null;
  }

  if (mainTrack.objectUrl) {
    return decodeUrl(context, mainTrack.objectUrl);
  }

  const file = await getAudioAssetFile(MAIN_AUDIO_ASSET_ID);
  if (file) {
    return decodeFile(context, file);
  }

  return null;
}

export function hasMainTrackAudio(mainTrack: MainTrackState) {
  return Boolean(mainTrack.fileName);
}

async function resolveClipBuffer(
  context: BaseAudioContext,
  clip: StudioClip,
  sample?: SampleItem,
) {
  if (!sample) {
    return null;
  }

  const file = await getAudioAssetFile(sample.id);

  if (!file) {
    return sample.objectUrl ? decodeUrl(context, sample.objectUrl) : null;
  }

  return decodeFile(context, file);
}

async function decodeFile(context: BaseAudioContext, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return context.decodeAudioData(arrayBuffer.slice(0));
}

async function decodeUrl(context: BaseAudioContext, url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
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
