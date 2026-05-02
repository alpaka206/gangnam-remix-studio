import { expect, test } from "@playwright/test";

test("studio editor supports the core remix workflow", async ({ page }) => {
  await page.goto("/studio");

  await expect(
    page.getByRole("heading", { name: "Gangnam Remix Studio" }),
  ).toBeVisible();
  await expect(page.getByText("Upload Main", { exact: true })).toBeVisible();
  await expect(page.getByText("Upload Meme Sound")).toHaveCount(0);
  await expect(page.getByText("No main music loaded")).toBeVisible();
  await expect(page.getByText("Meme Sounds")).toHaveCount(0);
  await expect(page.getByTestId("effect-lane")).toHaveCount(16);
  await expect(page.getByLabel("Add 옵 to timeline")).toBeVisible();
  await expect(page.getByLabel("Launchpad pitch")).toBeVisible();
  await expect(page.getByLabel("Launchpad speed")).toBeVisible();
  await expect(page.getByTestId("timeline-clip")).toHaveCount(0);

  await page.getByLabel("Add 옵 to timeline").click();
  await expect(page.getByTestId("clip-inspector")).toContainText("옵");
  await expect(page.getByTestId("timeline-clip")).toHaveCount(1);

  await page.keyboard.press("2");
  await expect(page.getByTestId("clip-inspector")).toContainText("여짜");
  await expect(page.getByTestId("timeline-clip")).toHaveCount(2);

  const timelineBox = await page.getByTestId("timeline").boundingBox();
  expect(timelineBox).toBeTruthy();
  await page.mouse.move(timelineBox!.x + 260, timelineBox!.y + 170);
  await page.keyboard.press("Control+C");
  await page.keyboard.press("Control+V");
  await page.keyboard.press("Control+V");
  await expect(page.getByTestId("timeline-clip")).toHaveCount(4);

  await page.getByLabel("Upload main music").setInputFiles({
    name: "test-main.wav",
    mimeType: "audio/wav",
    buffer: createTestWav(),
  });
  await expect(page.getByText("test-main.wav")).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await expect
    .poll(async () => page.getByTestId("current-time").textContent())
    .not.toBe("0:00.00");
  await page.getByRole("button", { name: "Stop" }).click();

  await page.getByLabel("Add 강남 to timeline").click();
  await expect(page.getByTestId("clip-inspector")).toContainText("강남");
  await expect(page.getByTestId("timeline-clip")).toHaveCount(5);

  await page
    .getByLabel("Add 강남 to timeline")
    .dragTo(page.getByTestId("timeline"), {
      targetPosition: { x: 420, y: 120 },
    });
  await expect(page.getByTestId("timeline-clip")).toHaveCount(6);

  const beforeZoom = await page
    .getByTestId("timeline-content")
    .evaluate((element) => element.getBoundingClientRect().width);
  await page.getByTestId("timeline").dispatchEvent("wheel", {
    bubbles: true,
    cancelable: true,
    ctrlKey: true,
    clientX: 480,
    deltaY: -700,
  });
  await expect
    .poll(async () =>
      page
        .getByTestId("timeline-content")
        .evaluate((element) => element.getBoundingClientRect().width),
    )
    .toBeGreaterThan(beforeZoom);

  await page.getByLabel("BPM").fill("128");
  await expect(page.getByLabel("BPM")).toHaveValue("128");

  await page.getByLabel("Speed").selectOption("1.25");
  await expect(page.getByLabel("Speed")).toHaveValue("1.25");

  await page.getByRole("button", { name: "Save" }).click();
  await page.reload();

  await expect(page.getByLabel("BPM")).toHaveValue("128");
  await expect(page.getByLabel("Speed")).toHaveValue("1.25");
  await expect(page.getByTestId("timeline-clip")).toHaveCount(6);
  await expect(page.getByText("test-main.wav")).toBeVisible();

  await page.getByTestId("timeline-clip").last().click();
  await page.keyboard.press("Delete");
  await expect(page.getByTestId("clip-inspector")).toContainText(
    "Select a sound",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Mix" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/gangnam-remix-.*\.wav/);
  await expect(page.getByTestId("export-status")).toContainText("export ready");
});

test("studio remains usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");

  await expect(page.getByTestId("timeline")).toBeVisible();
  await expect(page.getByTestId("sample-library")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Mix" })).toBeVisible();
});

function createTestWav() {
  const sampleRate = 44_100;
  const durationSeconds = 0.5;
  const sampleCount = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(44 + sampleCount * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + sampleCount * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(sampleCount * 2, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.3;
    buffer.writeInt16LE(Math.round(sample * 0x7fff), 44 + index * 2);
  }

  return buffer;
}
