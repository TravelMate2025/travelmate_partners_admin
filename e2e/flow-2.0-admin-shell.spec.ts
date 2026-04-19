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

test.describe("TravelMate admin auth and shell flows", () => {
  test("signs in with MFA and reaches protected admin routes", async ({ page }) => {
    await signInAs(page, "finance@travelmate.test", "TravelMate!2026", "555555");
    await expect(page.getByText("Actionable queues")).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage session" })).toBeVisible();

    await page.getByRole("link", { name: /Financial Operations/ }).click();
    await expect(page.getByRole("heading", { name: "Financial Operations" }).first()).toBeVisible();
    await expect(page.getByText("Settlement run failed for Nairobi premium-stay payout batch").first()).toBeVisible();

    await page.getByRole("link", { name: /Payout Review/ }).click();
    await expect(page.getByRole("heading", { name: "Payout Review" }).first()).toBeVisible();
    await expect(page.getByText("Pending bank-account update after rapid payout change").first()).toBeVisible();
  });

  test("drills down from dashboard metrics and queues into operational routes", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.getByRole("link", { name: "Open Verified Partners metric" }).click();
    await expect(page.getByRole("heading", { name: "Partner Accounts" }).first()).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Open queue" }).first().click();
    await expect(page.getByRole("heading", { name: "Verification Review" }).first()).toBeVisible();
  });

  test("blocks non-finance users from finance routes", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/financial-ops");
    await expect(page.getByRole("heading", { name: "This admin route requires a different role." })).toBeVisible();
    await expect(page.getByText(/Required roles: finance, super_admin/)).toBeVisible();
  });

  test("supports session sign out after successful admin login", async ({ page }) => {
    await signInAs(page, "support@travelmate.test", "TravelMate!2026");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByText("The admin session was closed successfully.")).toBeVisible();
  });
});
