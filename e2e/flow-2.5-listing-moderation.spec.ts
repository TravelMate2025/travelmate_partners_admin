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

test.describe("Flow 2.5 listing moderation", () => {
  test("operations can bulk-approve pending stay and transfer listings", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/moderation");

    await expect(page.getByRole("heading", { name: "Listing Moderation" }).first()).toBeVisible();
    await page.getByLabel("Select Accra Executive Airport Pickup").click();
    await page
      .getByPlaceholder("Capture moderation reason, correction guidance, or emergency context...")
      .fill("Approved after final compliance review.");
    await page.getByRole("button", { name: "Bulk approve selected" }).click();

    await expect(page.getByText(/executed approve for 2 listings/i).last()).toBeVisible();
    await expect(page.getByText("Listing approved")).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "approved" }).first()).toBeVisible();
  });

  test("reviewer moderates a transfer listing and sends it back for edits", async ({ page }) => {
    await signInAs(page, "reviewer@travelmate.test", "TravelMate!2026", "333333");
    await page.goto("/moderation");

    await expect(page.getByRole("heading", { name: "Listing Moderation" }).first()).toBeVisible();
    await page.getByLabel("Listing type").selectOption("transfer");
    await page.getByRole("button", { name: /Accra Executive Airport Pickup/i }).click();
    await expect(page.getByText("Airport arrival meet-and-greet visual used on the transfer detail page.")).toBeVisible();

    await page.getByLabel("Reason").selectOption("missing_details");
    await page
      .getByPlaceholder("Capture moderation reason, correction guidance, or emergency context...")
      .fill("Please clarify route limits and executive vehicle features before resubmitting.");
    await page.getByRole("button", { name: "Send back for edits" }).click();

    await expect(page.getByText(/executed send_back/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "rejected" }).first()).toBeVisible();
    await expect(page.getByText("Sent back for edits")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Moderation note" })).toHaveValue(
      "Please clarify route limits and executive vehicle features before resubmitting.",
    );
  });

  test("operations can emergency-unpublish a live stay listing", async ({ page }) => {
    await signInAs(page, "ops@travelmate.test", "TravelMate!2026", "222222");
    await page.goto("/moderation");

    await page.getByPlaceholder("Search listing, partner, or location").fill("River Lodge");
    await page.getByRole("button", { name: /Savannah Retreat River Lodge/i }).click();
    await expect(page.getByText(/Potential safety mismatch in excursion claims/i)).toBeVisible();

    await page.getByLabel("Reason").selectOption("safety_risk");
    await page
      .getByPlaceholder("Capture moderation reason, correction guidance, or emergency context...")
      .fill("Temporarily remove the listing while safety-language claims are verified.");
    await page.getByRole("button", { name: "Emergency unpublish", exact: true }).click();

    await expect(page.getByText(/executed emergency_unpublish/i).last()).toBeVisible();
    await expect(page.locator("span.tm-status-badge", { hasText: "paused" }).first()).toBeVisible();
    await expect(page.getByText("Emergency unpublish applied")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Moderation note" })).toHaveValue(
      "Temporarily remove the listing while safety-language claims are verified.",
    );
  });
});
