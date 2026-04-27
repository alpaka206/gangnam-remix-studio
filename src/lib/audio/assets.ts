export const MAIN_AUDIO_ASSET_ID = "main-audio";

type RegisteredAudioAsset = {
  file: File;
  objectUrl: string;
};

const audioAssets = new Map<string, RegisteredAudioAsset>();

export function registerAudioAsset(assetId: string, file: File, objectUrl: string) {
  const previous = audioAssets.get(assetId);

  if (previous && previous.objectUrl !== objectUrl) {
    URL.revokeObjectURL(previous.objectUrl);
  }

  audioAssets.set(assetId, { file, objectUrl });
}

export function getRegisteredAudioFile(assetId: string) {
  return audioAssets.get(assetId)?.file ?? null;
}

export function revokeRegisteredAudioAsset(assetId: string) {
  const asset = audioAssets.get(assetId);

  if (asset) {
    URL.revokeObjectURL(asset.objectUrl);
    audioAssets.delete(assetId);
  }
}

export function clearRegisteredAudioAssets() {
  for (const [assetId] of audioAssets) {
    revokeRegisteredAudioAsset(assetId);
  }
}
