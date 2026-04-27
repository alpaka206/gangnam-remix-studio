export const SAMPLE_DRAG_MIME = "application/x-gangnam-remix-sample-id";

export function setSampleDragData(
  dataTransfer: DataTransfer,
  sampleId: string,
) {
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(SAMPLE_DRAG_MIME, sampleId);
  dataTransfer.setData("text/plain", sampleId);
}

export function getSampleDragData(dataTransfer: DataTransfer) {
  return dataTransfer.getData(SAMPLE_DRAG_MIME);
}
