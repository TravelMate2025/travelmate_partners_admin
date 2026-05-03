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

test.describe("Flow 2.16 payout review", () => {
  test("finance admin reviews and resolves a settlement account verification case", async ({ page }) => {
    await signInAs(page, "finance@travelmate.test", "TravelMate!2026", "555555");
    await page.goto("/payout-review");

    await expect(page.getByRole("heading", { name: "Payout Review" }).first()).toBeVisible();
    await expect(page.getByText("Pending bank-account update after rapid payout change").first()).toBeVisible();

    await page.getByLabel("Payout review note").fill(
      "Ownership and account metadata are confirmed, so finance can release this payout method.",
    );
    await page.getByLabel("Payout review reason code").selectOption("ownership_confirmed");
    await page.getByRole("button", { name: "Approve payout method" }).click();

    await expect(page.getByText(/approved payout method for pending bank-account update after rapid payout change/i).last()).toBeVisible();
    await expect(page.getByText("Settlement Ready").first()).toBeVisible();
    await expect(page.getByText("Hold Clear").first()).toBeVisible();
  });
});
