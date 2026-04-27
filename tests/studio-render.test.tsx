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
    expect(screen.getByText("Meme Clips")).toBeInTheDocument();
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByTestId("sample-library")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload main music")).toBeInTheDocument();
    expect(screen.getByLabelText("Upload meme sounds")).toBeInTheDocument();
    expect(screen.getAllByText("op.mp3").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Add op from left sources" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add op to timeline" }),
    ).toBeInTheDocument();
  });
});
