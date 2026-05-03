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

test.describe("Flow 2.9 commercial controls", () => {
  test("finance updates commission and service fee settings", async ({ page }) => {
    await signInAs(page, "finance@travelmate.test", "TravelMate!2026", "555555");
    await page.goto("/commercial-controls");

    await expect(page.getByRole("heading", { name: "Commercial Controls" }).first()).toBeVisible();
    await page.getByLabel("Commission rate percent").fill("16");
    await page.getByLabel("Rule effective date").fill("2026-05-01");
    await page
      .getByPlaceholder("Capture pricing rationale, approval context, or adjustment explanation...")
      .fill("Raised marketplace commercial settings after margin review and settlement impact check.");
    await page.getByRole("button", { name: "Update rule" }).click();

    await expect(page.getByText(/updated commercial rule Global stay marketplace base commission/i).last()).toBeVisible();
    await expect(page.getByText(/Commission: 16%/i)).toBeVisible();
    await expect(page.getByText(/Service fee: 3 USD/i)).toBeVisible();
    await expect(page.getByText(/Audit detail: commission changed from 14 to 16 effective 2026-05-01/i)).toBeVisible();
  });

  test("finance records a manual adjustment with explicit audit detail", async ({ page }) => {
    await signInAs(page, "finance@travelmate.test", "TravelMate!2026", "555555");
    await page.goto("/commercial-controls");

    await page.getByLabel("Adjustment amount").fill("180");
    await page.getByLabel("Adjustment reason").fill("Campaign recovery");
    await page
      .getByPlaceholder("Capture pricing rationale, approval context, or adjustment explanation...")
      .fill("Recording campaign recovery after temporary service-fee concession cleanup.");
    await page.getByRole("button", { name: "Record adjustment" }).click();

    await expect(page.getByText(/recorded a manual commercial adjustment for Global stay marketplace base commission/i).last()).toBeVisible();
    await expect(page.getByText(/Lagos Stay Collective · credit · 180 USD/i)).toBeVisible();
    await expect(page.getByText(/Audit detail: credit 180 USD for Lagos Stay Collective because Campaign recovery./i)).toBeVisible();
  });
});
