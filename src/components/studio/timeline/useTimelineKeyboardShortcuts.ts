import { useEffect, useRef, type RefObject } from "react";

import type { TimelineClipboard } from "@/components/studio/timeline/types";
import { isEditableTarget } from "@/lib/dom";
import type { StudioStore } from "@/store/studioStore";
import type { SampleItem, StudioClip } from "@/types/studio";

type UseTimelineKeyboardShortcutsOptions = {
  addSampleClip: StudioStore["addSampleClip"];
  clips: StudioClip[];
  deleteClip: StudioStore["deleteClip"];
  duplicateClip: StudioStore["duplicateClip"];
  lastPointerTimeRef: RefObject<number | null>;
  playheadTime: number;
  samples: SampleItem[];
  selectedClipId: string | null;
  selectedSampleId: string | null;
};

export function useTimelineKeyboardShortcuts({
  addSampleClip,
  clips,
  deleteClip,
  duplicateClip,
  lastPointerTimeRef,
  playheadTime,
  samples,
  selectedClipId,
  selectedSampleId,
}: UseTimelineKeyboardShortcutsOptions) {
  const clipboardRef = useRef<TimelineClipboard | null>(null);
  const nextPasteTimeRef = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedClipId
      ) {
        deleteClip(selectedClipId);
        event.preventDefault();
        return;
      }

      const isShortcut = event.ctrlKey || event.metaKey;

      if (!isShortcut) {
        return;
      }

      if (event.key.toLowerCase() === "c") {
        const selectedClip = clips.find((clip) => clip.id === selectedClipId);

        if (selectedClip) {
          clipboardRef.current = {
            kind: "clip",
            clipId: selectedClip.id,
            duration: selectedClip.duration,
          };
          nextPasteTimeRef.current = null;
          event.preventDefault();
          return;
        }

        const selectedSample = samples.find(
          (sample) => sample.id === selectedSampleId,
        );

        if (selectedSample) {
          clipboardRef.current = {
            kind: "sample",
            sampleId: selectedSample.id,
            duration: Math.max(0.25, selectedSample.duration || 1),
          };
          nextPasteTimeRef.current = null;
          event.preventDefault();
        }
      }

      if (event.key.toLowerCase() === "v") {
        const clipboard = clipboardRef.current;

        if (!clipboard) {
          return;
        }

        const start =
          nextPasteTimeRef.current ??
          lastPointerTimeRef.current ??
          playheadTime;
        const clipId =
          clipboard.kind === "clip"
            ? duplicateClip(clipboard.clipId, { start, snap: false })
            : addSampleClip(clipboard.sampleId, { start, snap: false });

        if (clipId) {
          nextPasteTimeRef.current = start + clipboard.duration;
          event.preventDefault();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    addSampleClip,
    clips,
    deleteClip,
    duplicateClip,
    lastPointerTimeRef,
    playheadTime,
    samples,
    selectedClipId,
    selectedSampleId,
  ]);
}
