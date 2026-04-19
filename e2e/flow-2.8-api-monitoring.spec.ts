import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, email: string, password: string, mfaCode?: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to admin shell" }).click();

  if (mfaCode) {
    await page.getByLabel("One-time code").fill(mfaCode);
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
  }

  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

test.describe("Flow 2.8 API monitoring", () => {
  test("operations inspects and acts on an API anomaly", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/api-monitoring");

    await expect(page.getByRole("heading", { name: "API Monitoring" }).first()).toBeVisible();
    await page.getByRole("button", { name: /Rate-limit violation burst on partner export/i }).click();
    await page
      .getByPlaceholder("Capture investigation context, containment reasoning, or incident handoff notes...")
      .fill("Containment handoff prepared after repeated export abuse signals.");
    await page.getByRole("button", { name: "Queue client containment" }).click();

    await expect(page.getByText(/queued client containment from API monitoring alert/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "contained" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open API client governance record" })).toBeVisible();
  });

  test("operations can open an incident with a distinct visible outcome", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/api-monitoring");

    await page.getByRole("button", { name: /Error burst on booking read access/i }).click();
    await page
      .getByPlaceholder("Capture investigation context, containment reasoning, or incident handoff notes...")
      .fill("Escalating this anomaly into a formal incident for abuse review.");
    await page.getByRole("button", { name: "Open incident" }).click();

    await expect(page.getByText(/opened an incident from API monitoring alert/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "incident open" }).first()).toBeVisible();
    await expect(page.getByText(/Last linked action: open incident/i)).toBeVisible();
  });
});
