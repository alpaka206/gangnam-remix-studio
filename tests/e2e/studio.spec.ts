import { expect, test } from "@playwright/test";

test("studio editor supports the core remix workflow", async ({ page }) => {
  await page.goto("/studio");

  await expect(
    page.getByRole("heading", { name: "Gangnam Remix Studio" }),
  ).toBeVisible();
  await expect(page.getByText("Upload Main", { exact: true })).toBeVisible();
  await expect(page.getByText("Upload SFX / Stem")).toBeVisible();

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

  await page.getByTestId("timeline-clip").last().click();
  await page.getByTestId("delete-clip").click();
  await expect(page.getByTestId("clip-inspector")).toContainText(
    "Select a clip",
  );

  await page.getByRole("button", { name: "Export Mix" }).click();
  await expect(page.getByTestId("export-status")).toContainText(
    "export preparing",
  );
});

test("studio remains usable on a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");

  await expect(page.getByTestId("timeline")).toBeVisible();
  await expect(page.getByTestId("sample-library")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export Mix" })).toBeVisible();
});
