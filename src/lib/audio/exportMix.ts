import { MAIN_AUDIO_ASSET_ID, getAudioAssetFile } from "@/lib/audio/assets";
import {
  getMixTimelineEnd,
  hasMainTrackAudio,
  scheduleMix,
  type MixRenderData,
} from "@/lib/audio/mixEngine";
import { encodeAudioBufferToWav } from "@/lib/audio/wav";

const EXPORT_SAMPLE_RATE = 44_100;
const EXPORT_TAIL_SECONDS = 0.35;

export async function renderMixToWav(mix: MixRenderData) {
  const mainDuration =
    mix.mainTrack.duration || (await resolveMainTrackDuration(mix.mainTrack));
  const timelineEnd =
    Math.max(getMixTimelineEnd(mix), mainDuration) + EXPORT_TAIL_SECONDS;
  const renderDuration = timelineEnd / Math.max(0.1, mix.speed);
  const frameCount = Math.ceil(renderDuration * EXPORT_SAMPLE_RATE);
  const context = new OfflineAudioContext(
    2,
    Math.max(1, frameCount),
    EXPORT_SAMPLE_RATE,
  );

  await scheduleMix({
    context,
    destination: context.destination,
    mix,
    startTime: 0,
    timelineEnd,
  });

  const renderedBuffer = await context.startRendering();
  return encodeAudioBufferToWav(renderedBuffer);
}

async function resolveMainTrackDuration(mainTrack: MixRenderData["mainTrack"]) {
  if (!hasMainTrackAudio(mainTrack)) {
    return 0;
  }

  const arrayBuffer = mainTrack.objectUrl
    ? await fetchAudioArrayBuffer(mainTrack.objectUrl)
    : await fetchPersistentMainAudioArrayBuffer();

  if (!arrayBuffer) {
    return 0;
  }

  const context = new OfflineAudioContext(1, 1, EXPORT_SAMPLE_RATE);
  const decoded = await context.decodeAudioData(arrayBuffer.slice(0));

  return decoded.duration;
}

async function fetchPersistentMainAudioArrayBuffer() {
  const file = await getAudioAssetFile(MAIN_AUDIO_ASSET_ID);

  return file ? file.arrayBuffer() : null;
}

async function fetchAudioArrayBuffer(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.arrayBuffer();
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
