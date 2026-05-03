import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import path from "node:path";

const apiDir = path.resolve(__dirname, "../../api");
const apiPython = path.resolve(apiDir, "venv/bin/python");

function readActiveAdminMfaCode(email: string) {
  return execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c",
      [
        "from apps.users.models import AdminMfaChallenge, User",
        `user = User.objects.get(email='${email}')`,
        "challenge = AdminMfaChallenge.objects.filter(user=user, consumed_at__isnull=True).order_by('-created_at').first()",
        "print(challenge.code if challenge else '')",
      ].join("; "),
    ],
    { cwd: apiDir, encoding: "utf-8" },
  ).trim();
}

function resetAdminSessions(email: string) {
  execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c",
      [
        "from django.contrib.sessions.models import Session",
        "from apps.users.models import AdminSession, User",
        `user = User.objects.get(email='${email}')`,
        "session_keys = list(AdminSession.objects.filter(user=user).values_list('session_key', flat=True))",
        "AdminSession.objects.filter(user=user).delete()",
        "Session.objects.filter(session_key__in=session_keys).delete()",
        "print('ok')",
      ].join("; "),
    ],
    { cwd: apiDir, encoding: "utf-8" },
  );
}

async function signInAs(page: Page, email: string, password: string, mfaCode?: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to admin shell" }).click();

  const mfaField = page.getByLabel("One-time code");
  if (await mfaField.isVisible().catch(() => false)) {
    const resolvedMfaCode = mfaCode ?? readActiveAdminMfaCode(email);
    await expect(page.getByRole("heading", { name: "Verify MFA" })).toBeVisible();
    await mfaField.fill(resolvedMfaCode);
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
  }

  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

async function signInWithLiveMfa(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to admin shell" }).click();
  const mfaField = page.getByLabel("One-time code");
  if (await mfaField.isVisible().catch(() => false)) {
    const mfaCode = readActiveAdminMfaCode(email);
    await mfaField.fill(mfaCode);
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
  }
  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

test.describe("TravelMate admin auth and shell flows", () => {
  test("keeps the admin on the MFA step after an invalid code and allows a retry", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Admin email").fill("finance@travelmate.test");
    await page.getByLabel("Password").fill("TravelMate!2026");
    await page.getByRole("button", { name: "Continue to admin shell" }).click();
    const mfaField = page.getByLabel("One-time code");
    if (!(await mfaField.isVisible().catch(() => false))) {
      await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
      return;
    }

    await mfaField.fill("000000");
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
    await expect(page.getByText("The MFA code did not match. Please try again.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Verify MFA" })).toBeVisible();

    const financeMfaCode = readActiveAdminMfaCode("finance@travelmate.test");
    await page.getByLabel("One-time code").fill(financeMfaCode);
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
    await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
  });

  test("signs in with MFA and reaches protected admin routes", async ({ page }) => {
    await signInWithLiveMfa(page, "finance@travelmate.test", "TravelMate!2026");

    await expect(page.getByText("Actionable queues")).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage session" })).toBeVisible();
    await page.getByRole("link", { name: "Manage session" }).click();
    await expect(page.getByRole("heading", { name: "Session Management" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "API-backed session inventory" })).toBeVisible();
    await expect(page.getByText(/::node/).first()).toBeVisible();

    await page.goto("/");

    await page.getByRole("link", { name: /Financial Operations/ }).click();
    await expect(page.getByRole("heading", { name: "Financial Operations" }).first()).toBeVisible();
    await expect(page.getByText("Settlement run failed for Nairobi premium-stay payout batch").first()).toBeVisible();

    await page.getByRole("link", { name: /Payout Review/ }).click();
    await expect(page.getByRole("heading", { name: "Payout Review" }).first()).toBeVisible();
    await expect(page.getByText("Pending bank-account update after rapid payout change").first()).toBeVisible();
  });

  test("drills down from dashboard metrics and queues into operational routes", async ({ page }) => {
    await signInWithLiveMfa(page, "superadmin@travelmate.test", "TravelMate!2026");

    await page.getByRole("link", { name: "Open Verified Partners metric" }).click();
    await expect(page.getByRole("heading", { name: "Partner Accounts" }).first()).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: "Open queue" }).first().click();
    await expect(page.getByRole("heading", { name: "Verification Review" }).first()).toBeVisible();
  });

  test("blocks non-finance users from finance routes", async ({ page }) => {
    await signInWithLiveMfa(page, "ops@travelmate.test", "TravelMate!2026");

    await expect(page.getByText("Requires finance or super admin").first()).toBeVisible();
    await page.getByRole("link", { name: /Financial Operations \(Requires finance or super admin\)/ }).click();
    await expect(page).toHaveURL(/\/auth\/access-denied\?next=%2Ffinancial-ops&required=finance%2Csuper_admin/);
    await expect(page.getByText("Financial Operations")).toBeVisible();
    await expect(page.getByText(/Supervise partner settlement states, admin settlement runs/i)).toBeVisible();

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

  test("rotates the current admin session and can revoke a secondary tracked session", async ({ page, browser }) => {
    resetAdminSessions("support@travelmate.test");
    await signInAs(page, "support@travelmate.test", "TravelMate!2026");
    const baseUrl = new URL("/", page.url()).toString().replace(/\/$/, "");

    const secondaryContext = await browser.newContext();
    const secondaryPage = await secondaryContext.newPage();
    await secondaryPage.goto(`${baseUrl}/auth/login`);
    await secondaryPage.getByLabel("Admin email").fill("support@travelmate.test");
    await secondaryPage.getByLabel("Password").fill("TravelMate!2026");
    await secondaryPage.getByRole("button", { name: "Continue to admin shell" }).click();
    await expect(secondaryPage.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();

    await page.goto("/auth/sessions");
    await expect(page.getByRole("heading", { name: "Session Management" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Rotate current session" })).toBeVisible();
    await page.getByRole("button", { name: "Rotate current session" }).click();
    await expect(page.getByText("The current admin session was rotated successfully.")).toBeVisible();

    const revokeButtons = page.getByRole("button", { name: /End session / });
    await expect(revokeButtons).toHaveCount(1);
    await revokeButtons.first().click();
    await expect(page.getByText(/Tracked session \d+ was ended successfully\./)).toBeVisible();

    await secondaryPage.goto(`${baseUrl}/`);
    await expect(secondaryPage.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await secondaryContext.close();
  });
});
