import { expect, test } from "@playwright/test";

test("studio editor supports the core remix workflow", async ({ page }) => {
  await page.goto("/studio");

  await expect(
    page.getByRole("heading", { name: "Gangnam Remix Studio" }),
  ).toBeVisible();
  await expect(page.getByText("Upload Main", { exact: true })).toBeVisible();
  await expect(page.getByText("Upload SFX / Stem")).toBeVisible();

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

  await page.getByLabel("Add Kick Fill to timeline").click();
  await expect(page.getByTestId("clip-inspector")).toContainText("Kick Fill");

  await page.getByLabel("BPM").fill("128");
  await expect(page.getByLabel("BPM")).toHaveValue("128");

  await page.getByLabel("Speed").selectOption("1.25");
  await expect(page.getByLabel("Speed")).toHaveValue("1.25");

  await page.getByRole("button", { name: "Save" }).click();
  await page.reload();

  await expect(page.getByLabel("BPM")).toHaveValue("128");
  await expect(page.getByLabel("Speed")).toHaveValue("1.25");
  await expect(page.getByText("Kick Fill").first()).toBeVisible();
  await expect(page.getByText("test-main.wav")).toBeVisible();

  await page.getByTestId("timeline-clip").last().click();
  await page.getByTestId("delete-clip").click();
  await expect(page.getByTestId("clip-inspector")).toContainText(
    "Select a clip",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Mix" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/gangnam-remix-.*\.wav/);
  await expect(page.getByTestId("export-status")).toContainText(
    "export ready",
  );
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
