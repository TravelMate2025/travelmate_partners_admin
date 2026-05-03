import { expect, test, type Page } from "@playwright/test";

async function signInAs(page: Page, email: string, password: string, mfaCode?: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to admin shell" }).click();

  if (mfaCode) {
    const mfaField = page.getByLabel("One-time code");
    if (await mfaField.isVisible().catch(() => false)) {
      await mfaField.fill(mfaCode);
      await page.getByRole("button", { name: "Verify MFA and continue" }).click();
    }
  }

  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

test.describe("Flow 2.11 reports", () => {
  test("admin generates and exports a filtered report", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Reports & Analytics" }).first()).toBeVisible();
    await page.getByLabel("Report region").selectOption("east_africa");
    await page.getByLabel("Report timeframe").selectOption("90d");
    await page.getByLabel("Verification funnel").uncheck();
    await page.getByLabel("Listing conversion").uncheck();
    await page.getByLabel("Supply mix").uncheck();
    await page.getByRole("button", { name: "Export report" }).click();

    await expect(page.getByText(/exported analytics report travelmate-report-east_africa-90d.csv with Partner growth, API adoption/i).last()).toBeVisible();
    await expect(page.getByText("travelmate-report-east_africa-90d.csv", { exact: true })).toBeVisible();
    await expect(page.getByText("East Africa reporting snapshot · 2 sections")).toBeVisible();
    await expect(page.getByText("Sections: Partner growth, API adoption")).toBeVisible();
  });
});
