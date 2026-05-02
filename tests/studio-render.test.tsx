import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { StudioShell } from "@/components/studio/StudioShell";
import { useStudioStore } from "@/store/studioStore";

describe("StudioShell", () => {
  beforeEach(() => {
    useStudioStore.getState().resetProject();
  });

  it("renders the remix editor surface instead of a landing page", () => {
    render(<StudioShell />);

    expect(
      screen.getByRole("heading", { name: "Gangnam Remix Studio" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    expect(screen.queryByText("Meme Sounds")).not.toBeInTheDocument();
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByTestId("sample-library")).toBeInTheDocument();
    expect(screen.getAllByTestId("effect-lane")).toHaveLength(16);
    expect(screen.getByLabelText("Upload main music")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Upload meme sounds"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("No main music loaded")).toBeInTheDocument();
    expect(screen.getAllByText("옵").length).toBeGreaterThan(0);
    expect(screen.getAllByText("오빠달린다").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Launchpad pitch")).toBeInTheDocument();
    expect(screen.getByLabelText("Launchpad speed")).toBeInTheDocument();
    expect(screen.getByLabelText("효과음 초기화")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add 옵 to timeline" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("timeline-clip")).not.toBeInTheDocument();
  });

  it("maps launchpad keyboard shortcuts to the bundled pads", () => {
    render(<StudioShell />);

    fireEvent.keyDown(window, { key: "1" });

    expect(screen.getByTestId("timeline-clip")).toHaveTextContent("옵");
  });

  it("can clear placed effects from the launchpad", () => {
    render(<StudioShell />);

    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByTestId("timeline-clip")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("효과음 초기화"));

    expect(screen.queryByTestId("timeline-clip")).not.toBeInTheDocument();
  });
});
