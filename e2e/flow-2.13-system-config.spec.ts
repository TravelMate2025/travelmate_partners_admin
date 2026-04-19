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

test.describe("Flow 2.13 system config", () => {
  test("super admin sees all five configuration sections in the workspace", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await expect(page.getByRole("heading", { name: "Configuration master data" }).first()).toBeVisible();
    await expect(page.getByText("WiFi").first()).toBeVisible();
    await expect(page.getByText("Partner Bulk Upload").first()).toBeVisible();
    await expect(page.getByText("Kenya").first()).toBeVisible();
    await expect(page.getByText("Listing Rejected: Insufficient Photos").first()).toBeVisible();
    await expect(page.getByText("Partner Terms of Service v3.1").first()).toBeVisible();
  });

  test("super admin publishes a draft taxonomy item", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await page.getByText("Airport Parking").first().click();
    await page.getByLabel("Operator note").fill("Airport parking amenity reviewed and cleared for partner use.");
    await page.getByRole("button", { name: "Publish taxonomy item" }).click();

    await expect(page.getByText(/queued config change for backend propagation/i).last()).toBeVisible();
  });

  test("super admin activates a draft service region after dependency check passes", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await page.getByLabel("Configuration section").selectOption("regions");
    await page.getByText("Nairobi CBD").first().click();
    await page.getByLabel("Operator note").fill("Supply team signed off. Nairobi CBD service area ready to go live.");
    await page.getByRole("button", { name: "Activate region" }).click();

    await expect(page.getByText(/queued config change for backend propagation/i).last()).toBeVisible();
  });

  test("super admin publishes a draft moderation template", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await page.getByLabel("Configuration section").selectOption("templates");
    await page.getByText("Listing: Send Back for Corrections").first().click();
    await page.getByLabel("Operator note").fill("Moderation team reviewed and approved send-back template.");
    await page.getByRole("button", { name: "Publish template" }).click();

    await expect(page.getByText(/queued config change for backend propagation/i).last()).toBeVisible();
  });

  test("archiving an in-use moderation template is blocked with a dependency message", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await page.getByLabel("Configuration section").selectOption("templates");
    await page.getByText("Listing Rejected: Insufficient Photos").first().click();
    await page.getByLabel("Operator note").fill("Attempting to archive this active template.");
    await page.getByRole("button", { name: "Archive", exact: true }).click();

    await expect(page.getByText(/referenced by 47 active moderation workflows/i)).toBeVisible();
  });

  test("super admin publishes a draft static content announcement", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/system-config");

    await page.getByLabel("Configuration section").selectOption("content");
    await page.getByText("Platform Maintenance Schedule Update").first().click();
    await page.getByLabel("Operator note").fill("Ops team approved maintenance announcement for partner distribution.");
    await page.getByRole("button", { name: "Publish content" }).click();

    await expect(page.getByText(/queued config change for backend propagation/i).last()).toBeVisible();
  });

  test("operations admin can toggle features but not publish taxonomy or manage regions", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/system-config");

    await page.getByText("Airport Parking").first().click();
    await expect(page.getByRole("button", { name: "Publish taxonomy item" })).not.toBeAttached();

    await page.getByLabel("Configuration section").selectOption("regions");
    await page.getByText("Nairobi CBD").first().click();
    await expect(page.getByRole("button", { name: "Activate region" })).not.toBeAttached();
  });

  test("operations admin enables a disabled feature toggle", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/system-config");

    await page.getByText("Dynamic Pricing Engine").first().click();
    await page.getByLabel("Operator note").fill("Legal review resolved. Enabling dynamic pricing for East Africa pilot.");
    await page.getByRole("button", { name: "Enable feature" }).click();

    await expect(page.getByText(/queued config change for backend propagation/i).last()).toBeVisible();
  });

  test("reviewer is redirected away from the system config route", async ({ page }) => {
    await signInAs(page, "reviewer@travelmate.test", "TravelMate!2026", "333333");
    await page.goto("/system-config");

    await expect(page).toHaveURL(/\/auth\/access-denied\?next=%2Fsystem-config/);
  });
});
