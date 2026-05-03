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

test.describe("Flow 2.4 partner operations", () => {
  test("operations can search, edit metadata, and restore an archived partner account", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/partners");

    await expect(page.getByRole("heading", { name: "Partner Accounts" }).first()).toBeVisible();
    await page.getByPlaceholder("Search partner, business, or email").fill("Savannah");
    await page.getByRole("button", { name: /Maya Patel/i }).click();
    await expect(page.getByLabel("Market owner")).toHaveValue("East Africa Supply");
    await page.getByRole("button", { name: "Restore account" }).click();

    await expect(page.getByText(/executed restore for Savannah Retreat Collections/i)).toBeVisible();
    await expect(page.getByText("Account restored")).toBeVisible();
    await expect(page.getByRole("button", { name: "Restore account" })).toBeDisabled();

    await page.getByPlaceholder("Search partner, business, or email").fill("");
    await page.getByRole("button", { name: /Amina Yusuf/i }).click();
    await page.getByLabel("Market owner").fill("Strategic Coverage Team");
    await page.getByRole("button", { name: "Save metadata" }).click();

    await expect(page.getByText(/executed update_metadata for North Harbour Stays/i)).toBeVisible();
    await expect(page.getByLabel("Market owner")).toHaveValue("Strategic Coverage Team");
  });
});
