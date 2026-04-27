const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
]);

const SUPPORTED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a"];

type BrowserAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function isSupportedAudioFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    SUPPORTED_AUDIO_TYPES.has(file.type) ||
    SUPPORTED_AUDIO_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension),
    )
  );
}

export function createAudioObjectUrl(file: File) {
  return URL.createObjectURL(file);
}

export async function getAudioDuration(file: File) {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const AudioContextClass =
      window.AudioContext ?? (window as BrowserAudioWindow).webkitAudioContext;

    if (AudioContextClass) {
      const context = new AudioContextClass();
      const buffer = await file.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(buffer.slice(0));
      await context.close();
      return Number(audioBuffer.duration.toFixed(2));
    }
  } catch {
    return getMediaElementDuration(file);
  }

  return getMediaElementDuration(file);
}

function getMediaElementDuration(file: File) {
  return new Promise<number>((resolve) => {
    const audio = document.createElement("audio");
    const objectUrl = URL.createObjectURL(file);

    audio.preload = "metadata";
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number((audio.duration || 0).toFixed(2)));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}
