export function canStartTimelinePan(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("[data-testid='timeline-clip']")) {
    return false;
  }

  if (target.closest("[data-lane-label='true']")) {
    return false;
  }

  return true;
}
