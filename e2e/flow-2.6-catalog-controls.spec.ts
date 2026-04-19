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

test.describe("Flow 2.6 catalog controls", () => {
  test("operations resolves a taxonomy issue from the quality queue", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/catalog-controls");

    await expect(page.getByRole("heading", { name: "Catalog Controls" }).first()).toBeVisible();
    await page.getByLabel("Issue type").selectOption("taxonomy");
    await page.getByRole("button", { name: /Accra Gold Line Executive Shuttle/i }).click();
    await expect(page.getByText(/Executive Gold -> Executive SUV/i).first()).toBeVisible();

    await page
      .getByPlaceholder("Capture the correction, taxonomy change, or suspicious-listing resolution...")
      .fill("Standardized transfer labels and aligned them to the approved catalog taxonomy.");
    await page.getByRole("button", { name: "Standardize taxonomy", exact: true }).click();

    await expect(page.getByText(/standardized taxonomy/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "resolved" }).first()).toBeVisible();
  });
});
