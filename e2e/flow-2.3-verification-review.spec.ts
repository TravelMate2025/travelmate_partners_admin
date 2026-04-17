import { expect, test } from "@playwright/test";

async function signInAsReviewer(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill("reviewer@travelmate.test");
  await page.getByLabel("Password").fill("TravelMate!2026");
  await page.getByRole("button", { name: "Continue to admin shell" }).click();
  await page.getByLabel("One-time code").fill("333333");
  await page.getByRole("button", { name: "Verify MFA and continue" }).click();
  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

test.describe("Flow 2.3 verification review", () => {
  test("reviewer sees submitted document packets with preview-ready backend metadata", async ({ page }) => {
    await signInAsReviewer(page);
    await page.goto("/verification-review");

    await expect(page.getByText("Primary passport page and signature page uploaded from the partner verification wizard.")).toBeVisible();
    await expect(page.getByText("/api/backend/verification-cases/verify-001/documents/doc-1/download")).toBeVisible();
    await page.getByRole("button", { name: /Business registration/i }).click();
    await expect(page.getByText("Business certificate packet with registrar stamp, director listing, and filing reference pages.")).toBeVisible();
    await expect(page.getByText(/registrar stamp is partially obscured/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Preview secure file" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Simulate signed download" })).toBeVisible();
  });

  test("reviewer requests more info and preserves pending lifecycle alignment", async ({ page }) => {
    await signInAsReviewer(page);
    await page.goto("/verification-review");

    await expect(page.getByRole("heading", { name: "Verification Review" }).first()).toBeVisible();
    await page.getByRole("button", { name: /David Mensah/i }).click();
    await page.getByPlaceholder("Add approval rationale, rejection reason, or resubmission guidance...").fill(
      "Please re-upload the tax certificate with the registration number visible.",
    );
    await page.getByRole("button", { name: "Request more info" }).click();

    await expect(page.locator("text=in_review").first()).toBeVisible();
    await expect(page.locator("text=pending").first()).toBeVisible();
    await expect(
      page.getByText("Partner remains pending and receives an additional-document request."),
    ).toBeVisible();
    await expect(page.getByText("Latest review event: More information requested")).toBeVisible();
    await expect(page.getByText("verification_more_info")).toBeVisible();
  });

  test("approved cases only expose the lifecycle control that still applies", async ({ page }) => {
    await signInAsReviewer(page);
    await page.goto("/verification-review");

    await page.getByRole("button", { name: /Maya Patel/i }).click();

    await expect(page.getByRole("button", { name: "Approve verification" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Reject verification" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Request more info" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Suspend lifecycle" })).toBeEnabled();
    await expect(page.getByText("Latest review event: Verification approved")).toBeVisible();
  });
});
