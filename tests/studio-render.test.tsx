import { render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("Meme Sounds")).toBeInTheDocument();
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByTestId("sample-library")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload main music")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload meme sounds")).toBeInTheDocument();
    expect(screen.getByText("No main music loaded")).toBeInTheDocument();
    expect(
      screen.getByText("Upload a sound below to place it here."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No sounds loaded. Upload a meme sound to add it to the timeline.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("op.mp3")).not.toBeInTheDocument();
  });
});
