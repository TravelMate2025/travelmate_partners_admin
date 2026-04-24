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

test.describe("Flow 2.17 admin users", () => {
  test("super admin manages an internal admin account and audit trail", async ({ page }) => {
    await signInAs(page, "superadmin@travelmate.test", "TravelMate!2026", "111111");
    await page.goto("/admin-users");

    await expect(page.getByRole("heading", { name: "Admin Users" }).first()).toBeVisible();

    await page.getByLabel("Invite admin name").fill("Lara Mensah");
    await page.getByLabel("Invite admin email").fill("lara.mensah@travelmate.test");
    await page.getByLabel("Invite admin team").selectOption("Verification Review");
    await page.getByLabel("Invite admin note").fill(
      "Adding a new governance reviewer to support the compliance backlog.",
    );
    await page.getByRole("button", { name: "Invite admin" }).click();

    await expect(page.getByText(/invited lara mensah into the admin dashboard/i).last()).toBeVisible();

    await page.getByText("Maya Singh").click();
    await page.getByLabel("Admin governance note").fill(
      "MFA posture and workstation ownership were reviewed, so this admin can be reactivated.",
    );
    await page.getByRole("button", { name: "Activate admin" }).click();

    await expect(page.getByText(/activated the admin account for maya singh/i).last()).toBeVisible();

    await page.getByLabel("Target admin role").selectOption("finance");
    await page.getByLabel("Confirm finance or super admin grant").check();
    await page.getByLabel("Admin governance note").fill(
      "Reassigning this reviewer into finance after the governance approval review.",
    );
    await page.getByRole("button", { name: "Apply role" }).click();

    await expect(page.getByText(/changed lara mensah to role finance/i).last()).toBeVisible();
    await expect(page.getByText("Finance routes").first()).toBeVisible();
  });
});
