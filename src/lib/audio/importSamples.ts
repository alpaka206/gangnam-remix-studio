import { registerAudioAsset } from "@/lib/audio/assets";
import {
  createAudioObjectUrl,
  getAudioDuration,
  isSupportedAudioFile,
} from "@/lib/audio/files";
import { savePersistentAudioAsset } from "@/lib/audio/persistentAssets";
import { createStudioId } from "@/lib/id";
import type { UploadedSampleInput } from "@/types/studio";

export function findUnsupportedAudioFile(files: File[]) {
  return files.find((file) => !isSupportedAudioFile(file)) ?? null;
}

export async function createUploadedSampleInputs(
  files: File[],
): Promise<UploadedSampleInput[]> {
  return Promise.all(
    files.map(async (file) => {
      const id = createStudioId("uploaded-sample");
      const objectUrl = createAudioObjectUrl(file);

      registerAudioAsset(id, file, objectUrl);
      void savePersistentAudioAsset(id, file);

      return {
        id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        duration: await getAudioDuration(file),
        objectUrl,
      };
    }),
  );
}
