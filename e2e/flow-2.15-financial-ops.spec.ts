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

test.describe("Flow 2.15 financial operations", () => {
  test("finance admin reviews settlement operations and refund follow-up flow", async ({ page }) => {
    await signInAs(page, "finance@travelmate.test", "TravelMate!2026", "555555");
    await page.goto("/financial-ops");

    await expect(page.getByRole("heading", { name: "Financial Operations" }).first()).toBeVisible();
    await expect(page.getByText("Settlement run failed for Nairobi premium-stay payout batch").first()).toBeVisible();

    await page.getByLabel("Financial operations note").fill(
      "Retrying the payout batch after documenting the reconciliation exception.",
    );
    await page.getByRole("button", { name: "Retry settlement run" }).click();
    await expect(page.getByText(/queued a settlement retry for settlement run failed for nairobi premium-stay payout batch/i).last()).toBeVisible();

    await page.getByText("Refund follow-up pending for cancelled airport transfer").first().click();
    await page.getByLabel("Financial operations note").fill(
      "Queueing partner refund follow-up before finance closes the reverse settlement trail.",
    );
    await page.getByRole("button", { name: "Notify partner refund" }).click();
    await expect(page.getByText(/queued refund follow-up for refund follow-up pending for cancelled airport transfer/i).last()).toBeVisible();

    await page.getByLabel("Financial operations note").fill(
      "Recording refund recovery after partner acknowledgement and finance confirmation.",
    );
    await page.getByRole("button", { name: "Record refund recovery" }).click();
    await expect(page.getByText(/recorded refund recovery for refund follow-up pending for cancelled airport transfer/i).last()).toBeVisible();

    await page.getByText("Completed payout ready for partner statement delivery").first().click();
    await page.getByLabel("Financial operations note").fill(
      "Generating the partner settlement statement for the completed weekly payout.",
    );
    await page.getByRole("button", { name: "Generate statement" }).click();
    await expect(page.getByText(/generated a settlement statement for completed payout ready for partner statement delivery/i).last()).toBeVisible();
  });
});
