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

test.describe("Flow 2.7 API clients", () => {
  test("operations manages an API client lifecycle from review through key rotation", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/api-clients");

    await expect(page.getByRole("heading", { name: "API Clients" }).first()).toBeVisible();
    await page.getByLabel("Assigned plan").selectOption("starter");
    await page.getByLabel("Rate limit per minute").fill("120");
    await page
      .getByPlaceholder("Capture approval context, rejection reason, quota decision, or containment note...")
      .fill("Approved after business API review and procurement fit validation.");
    await page.getByRole("button", { name: "Approve client" }).click();

    await expect(page.getByText(/approved API client VoyageStack Labs/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "approved" }).first()).toBeVisible();

    await page.getByRole("button", { name: /RouteFlow Integrations/i }).click();
    await page.getByLabel("Assigned plan").selectOption("growth");
    await page.getByLabel("Rate limit per minute").fill("180");
    await page.getByRole("button", { name: "Update plan" }).click();

    await expect(page.getByText(/updated the API plan for RouteFlow Integrations/i).last()).toBeVisible();
    await page.getByRole("button", { name: "Issue key" }).click();

    await expect(page.getByText(/issued an API key for RouteFlow Integrations/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "active" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Regenerate key" }).click();
    await expect(page.getByText(/regenerated the API key for RouteFlow Integrations/i).last()).toBeVisible();

    await page.getByRole("button", { name: "Revoke key" }).click();
    await expect(page.getByText(/revoked the API key for RouteFlow Integrations/i).last()).toBeVisible();
  });
});
