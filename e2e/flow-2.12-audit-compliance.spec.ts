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

test.describe("Flow 2.12 audit compliance", () => {
  test("super admin reviews and exports filtered compliance evidence", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/audit-compliance");

    await expect(page.getByRole("heading", { name: "Audit & Compliance" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Critical action traces" }).first()).toBeVisible();

    await page.getByLabel("Audit category").selectOption("financial");
    await expect(page.getByText("East Africa stays — standard tier").first()).toBeVisible();

    await page.getByText("East Africa stays — standard tier").first().click();
    await expect(page.getByText("update commission rule").first()).toBeVisible();

    await page.getByLabel("Export reason").fill(
      "Exporting financial audit entries for Q1 internal compliance review and finance team audit.",
    );
    await page.getByLabel("Export compliance data").click();

    await expect(page.getByText(/exported.*financial/i).last()).toBeVisible();
    await expect(page.getByText(/travelmate-audit-export-.*-financial\.csv/i).first()).toBeVisible();
  });

  test("super admin sees retention controls and access policy", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/audit-compliance");

    await expect(page.getByText("Data retention controls")).toBeVisible();
    await expect(page.getByText("365 days")).toBeVisible();
    await expect(page.getByText("Role-based audit access")).toBeVisible();
  });

  test("operations admin can export but not see retention controls", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/audit-compliance");

    await expect(page.getByLabel("Export compliance data")).toBeVisible();
    await expect(page.getByText("Data retention controls")).not.toBeVisible();
    await expect(page.getByText("Role-based audit access")).toBeVisible();
  });

  test("reviewer cannot access export and sees restricted category set", async ({ page }) => {
    await signInAs(page, "reviewer@travelmate.test", "TravelMate!2026", "333333");
    await page.goto("/audit-compliance");

    await expect(page.getByLabel("Export compliance data")).not.toBeAttached();

    const categorySelect = page.getByLabel("Audit category");
    await expect(categorySelect.locator("option[value='admin_access']")).not.toBeAttached();
    await expect(categorySelect.locator("option[value='financial']")).not.toBeAttached();
  });

  test("admin filters by risk level and selects a critical event", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/audit-compliance");

    await page.getByLabel("Risk level").selectOption("critical");

    await expect(page.getByText("RapidTransfer EA").first()).toBeVisible();
    await page.getByText("RapidTransfer EA").first().click();

    await expect(page.getByText(/suspend partner/i).first()).toBeVisible();
  });

  test("filter state persists in URL", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/audit-compliance");

    await page.getByLabel("Audit category").selectOption("settlement");
    await expect(page).toHaveURL(/category=settlement/);

    await page.getByLabel("Risk level").selectOption("critical");
    await expect(page).toHaveURL(/risk=critical/);
  });
});
