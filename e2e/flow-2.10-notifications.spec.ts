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

test.describe("Flow 2.10 notifications", () => {
  test("support sends a partner-facing communication successfully", async ({ page }) => {
    await signInAs(page, "support@travelmate.test", "TravelMate!2026");
    await page.goto("/notifications");

    await expect(page.getByRole("heading", { name: "Partner Messaging" }).first()).toBeVisible();
    await page.getByLabel("Notification title").fill("Verified partner payout timeline notice");
    await page
      .getByLabel("Notification body")
      .fill("Statements now arrive every Tuesday by 10:00 UTC. Review your dashboard for the updated payout schedule.");
    await page
      .getByPlaceholder("Capture why this message is being sent, approval context, or delivery follow-up notes...")
      .fill("Sending after finance confirmed the revised payout timeline for verified partners.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText(/queued partner notification Verified partner payout timeline notice for backend delivery/i).last()).toBeVisible();
    await expect(page.getByText(/Delivery handoff:/i)).toBeVisible();
    await expect(page.getByText(/Estimated audience size: 184 partners./i)).toBeVisible();
  });

  test("reviewers cannot access the notifications route", async ({ page }) => {
    await signInAs(page, "reviewer@travelmate.test", "TravelMate!2026", "333333");
    await page.goto("/notifications");

    await expect(page).toHaveURL(/\/auth\/access-denied\?next=%2Fnotifications/);
  });
});
