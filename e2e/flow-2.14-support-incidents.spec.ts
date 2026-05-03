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

test.describe("Flow 2.14 support incidents", () => {
  test("support admin handles a partner issue end to end", async ({ page }) => {
    await signInAs(page, "support@travelmate.test", "TravelMate!2026");
    await page.goto("/support-incidents");

    await expect(page.getByRole("heading", { name: "Support & Incidents" }).first()).toBeVisible();
    await expect(page.getByText("Partner cannot reopen locked account after ID revalidation").first()).toBeVisible();

    await page.getByLabel("Support internal note").fill(
      "Flagging an incident because unlock recovery is still failing for the partner.",
    );
    await page.getByRole("button", { name: "Flag incident" }).click();
    await expect(page.getByText(/flagged an incident on partner cannot reopen locked account/i).last()).toBeVisible();

    await page.getByLabel("Support internal note").fill(
      "Escalating this account-access case to operations for unlock recovery review.",
    );
    await page.getByRole("button", { name: "Escalate case" }).click();
    await expect(page.getByText(/escalated partner cannot reopen locked account/i).last()).toBeVisible();

    await page.getByLabel("Support internal note").fill(
      "Partner access restored and incident trail can now be closed safely.",
    );
    await page.getByRole("button", { name: "Resolve case" }).click();
    await expect(page.getByText(/resolved partner cannot reopen locked account/i).last()).toBeVisible();
    await expect(page.getByText("Case resolved").first()).toBeVisible();
  });
});
