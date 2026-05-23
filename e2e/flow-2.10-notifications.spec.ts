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

function seedPartnerNotificationFixtures() {
  const script = [
    "from apps.users.models import User",
    "from apps.users.choices import UserRole",
    "from apps.partners.models import PartnerVerificationProfile, PartnerOnboardingProfile",
    "fixtures = [",
    "  ('e2e.partner.verified1@travelmate.test', 'TravelMate!2026', 'verified', 'approved', ['Nigeria'], ['Lagos'], ['Ikeja']),",
    "  ('e2e.partner.verified2@travelmate.test', 'TravelMate!2026', 'verified', 'approved', ['Nigeria'], ['Lagos'], ['Lekki']),",
    "  ('e2e.partner.watchlist@travelmate.test', 'TravelMate!2026', 'pending', 'rejected', ['Nigeria'], ['Lagos'], ['Yaba']),",
    "  ('e2e.partner.api.client@travelmate.test', 'TravelMate!2026', 'verified', 'approved', ['Nigeria'], ['Lagos'], ['Victoria Island']),",
    "]",
    "for email, password, lifecycle, status, countries, regions, cities in fixtures:",
    "  user, created = User.objects.get_or_create(",
    "      email=email,",
    "      defaults={",
    "          'username': email,",
    "          'phone': '+2348000000000',",
    "          'role': UserRole.PARTNER,",
    "          'email_verified': True,",
    "          'is_active': True,",
    "      },",
    "  )",
    "  if created:",
    "      user.set_password(password)",
    "      user.save(update_fields=['password'])",
    "  if user.role != UserRole.PARTNER:",
    "      user.role = UserRole.PARTNER",
    "      user.save(update_fields=['role'])",
    "  profile, _ = PartnerVerificationProfile.objects.get_or_create(partner=user)",
    "  profile.lifecycle_state = lifecycle",
    "  profile.status = status",
    "  profile.needs_more_info = status == 'rejected'",
    "  profile.save(update_fields=['lifecycle_state', 'status', 'needs_more_info'])",
    "  onboarding, _ = PartnerOnboardingProfile.objects.get_or_create(partner=user)",
    "  onboarding.operating_countries = countries",
    "  onboarding.operating_regions = regions",
    "  onboarding.operating_cities = cities",
    "  onboarding.trade_name = onboarding.trade_name or email.split('@')[0]",
    "  onboarding.legal_name = onboarding.legal_name or email.split('@')[0]",
    "  onboarding.save(update_fields=['operating_countries', 'operating_regions', 'operating_cities', 'trade_name', 'legal_name'])",
  ].join("\n");

  execFileSync(
    apiPython,
    [
      "manage.py",
      "shell",
      "-c", script,
    ],
    { cwd: apiDir, encoding: "utf-8" },
  );
}

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

  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 15_000 });
}

async function signInWithLiveMfa(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Continue to admin shell" }).click();
  const mfaField = page.getByLabel("One-time code");
  if (await mfaField.isVisible().catch(() => false)) {
    await mfaField.fill(readActiveAdminMfaCode(email));
    await page.getByRole("button", { name: "Verify MFA and continue" }).click();
  }
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/login"), { timeout: 15_000 });
}

test.describe("Flow 2.10 notifications", () => {
  test.beforeAll(() => {
    seedPartnerNotificationFixtures();
  });

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
    await signInWithLiveMfa(page, "reviewer@travelmate.test", "TravelMate!2026");
    await page.goto("/notifications");

    await expect(page).toHaveURL(/\/auth\/access-denied\?next=%2Fnotifications&required=super_admin%2Coperations%2Csupport%2Cfinance/);
    await expect(page.getByText(/Required roles: super_admin, operations, support, finance/i)).toBeVisible();
  });

  test("supports all message types and audience segment combinations", async ({ page }) => {
    await signInAs(page, "support@travelmate.test", "TravelMate!2026");
    await page.goto("/notifications");

    const cases: Array<{
      kind: "direct" | "broadcast" | "transactional";
      segment: "all_partners" | "verified_partners" | "watchlist" | "api_clients" | "region" | "partner";
      region?: string;
      requiresPartnerSelect?: boolean;
    }> = [
      { kind: "direct", segment: "all_partners" },
      { kind: "direct", segment: "verified_partners" },
      { kind: "direct", segment: "watchlist" },
      { kind: "direct", segment: "api_clients" },
      { kind: "direct", segment: "region", region: "Lagos" },
      { kind: "direct", segment: "partner", requiresPartnerSelect: true },
      { kind: "broadcast", segment: "verified_partners" },
      { kind: "broadcast", segment: "region", region: "Lagos" },
      { kind: "transactional", segment: "all_partners" },
      { kind: "transactional", segment: "partner", requiresPartnerSelect: true },
    ];

    for (const [index, item] of cases.entries()) {
      await page.getByRole("button", { name: "Partner Messages" }).click();
      await page.getByRole("button", { name: "New Message Draft" }).click();

      await page.getByLabel("Message type").selectOption(item.kind);
      await page.getByLabel("Audience segment").selectOption(item.segment);

      if (item.segment === "region") {
        await page.getByLabel("Target region").fill(item.region ?? "Lagos");
      }

      if (item.requiresPartnerSelect) {
        const partnerSelect = page.getByLabel("Target partner");
        await expect(partnerSelect).toBeVisible();
        const options = await partnerSelect.locator("option").allTextContents();
        const nonPlaceholder = options.filter((value) => value.trim().toLowerCase() !== "select partner");
        expect(nonPlaceholder.length).toBeGreaterThan(0);
        await partnerSelect.selectOption({ index: 1 });
      }

      await page.getByLabel("Notification title").fill(`E2E notification ${index + 1} ${item.kind} ${item.segment}`);
      await page
        .getByLabel("Notification body")
        .fill(
          `E2E notification ${index + 1} validates ${item.kind} for ${item.segment} audience segment with a sufficiently descriptive operational message.`,
        );
      await page
        .getByPlaceholder("Capture why this message is being sent, approval context, or delivery follow-up notes...")
        .fill(`E2E validation note ${index + 1} for ${item.kind}/${item.segment}.`);

      await page.getByRole("button", { name: "Send message" }).click();

      await expect(page.getByText(/queued partner notification/i).last()).toBeVisible();
      await expect(page.getByText(/Delivery handoff:/i)).toBeVisible();
    }
  });
});
