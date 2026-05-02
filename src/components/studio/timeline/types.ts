export type DragState = {
  clipId: string;
  startClientX: number;
  initialStart: number;
};

export type TimelinePanState = {
  pointerId: number;
  startClientX: number;
  startScrollLeft: number;
};

export type TimelineClipboard =
  | { kind: "clip"; clipId: string; duration: number }
  | { kind: "sample"; sampleId: string; duration: number };
