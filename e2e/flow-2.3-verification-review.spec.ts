import { expect, test, type APIRequestContext } from "@playwright/test";

async function signInAsReviewer(page: Parameters<typeof test>[0]["page"]) {
  await page.goto("/auth/login");
  await page.getByLabel("Admin email").fill("reviewer-lite@travelmate.test");
  await page.getByLabel("Password").fill("TravelMate!2026");
  await page.getByRole("button", { name: "Continue to admin shell" }).click();
  await expect(page.getByRole("heading", { name: "Operations Overview" }).first()).toBeVisible();
}

async function createSubmittedVerificationCase(request: APIRequestContext) {
  const unique = Date.now();
  const email = `verification-review+${unique}@example.com`;
  const phone = `+2348${String(unique).slice(-9)}`;

  const otpResponse = await request.post("http://127.0.0.1:8000/api/v1/auth/signup/request-otp", {
    data: { email, phone },
  });
  const otpPayload = (await otpResponse.json()) as { data: { otp_code_hint?: string } };

  const signupResponse = await request.post("http://127.0.0.1:8000/api/v1/auth/signup", {
    data: {
      email,
      phone,
      password: "Password123!",
      otpCode: otpPayload.data.otp_code_hint,
    },
  });
  const signupPayload = (await signupResponse.json()) as {
    data: { verification_code_hint?: string };
  };

  await request.post("http://127.0.0.1:8000/api/v1/auth/verify-email", {
    data: {
      email,
      code: signupPayload.data.verification_code_hint,
    },
  });
  await request.post("http://127.0.0.1:8000/api/v1/auth/login", {
    data: { email, password: "Password123!" },
  });

  const meResponse = await request.get("http://127.0.0.1:8000/api/v1/auth/me");
  const mePayload = (await meResponse.json()) as { data: { id: string } };
  const userId = mePayload.data.id;

  for (const [step, data] of [
    [
      "business",
      {
        businessType: "business",
        legalName: `Review Case ${unique} Ltd`,
        tradeName: `Review Case ${unique}`,
        registrationNumber: `RC${unique}`,
      },
    ],
    [
      "contact",
      {
        primaryContactName: `Reviewer Case ${unique}`,
        primaryContactEmail: `reviewer-case-${unique}@example.com`,
        supportContactEmail: `support-${unique}@example.com`,
      },
    ],
    [
      "operations",
      {
        operatingCountries: ["Nigeria"],
        operatingRegions: ["Lagos"],
        operatingCities: ["Lekki"],
        coverageNotes: "",
        payoutMethod: "bank_transfer",
        settlementCurrency: "NGN",
        payoutSchedule: "weekly",
      },
    ],
  ] as const) {
    await request.patch(`http://127.0.0.1:8000/api/v1/partners/${userId}/onboarding`, {
      data: { step, data },
    });
  }

  await request.post(`http://127.0.0.1:8000/api/v1/partners/${userId}/onboarding/submit`);

  for (const document of [
    {
      category: "identity",
      name: "identity-proof.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 identity proof"),
    },
    {
      category: "business",
      name: "business-registration.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 business registration"),
    },
  ]) {
    await request.post(`http://127.0.0.1:8000/api/v1/partners/${userId}/verification/documents`, {
      multipart: {
        category: document.category,
        file: {
          name: document.name,
          mimeType: document.mimeType,
          buffer: document.buffer,
        },
      },
    });
  }

  await request.post(`http://127.0.0.1:8000/api/v1/partners/${userId}/verification/submit`);

  return {
    businessName: `Review Case ${unique}`,
    partnerName: `Reviewer Case ${unique}`,
  };
}

test.describe("Flow 2.3 verification review", () => {
  test("reviewer sees submitted partner packets and can request more information", async ({
    page,
    request,
  }) => {
    const seeded = await createSubmittedVerificationCase(request);

    await signInAsReviewer(page);
    await page.goto("/verification-review");

    await page.getByRole("button", { name: new RegExp(seeded.partnerName, "i") }).click();
    await expect(page.getByText("identity-proof.pdf").first()).toBeVisible();
    await expect(
      page.getByText(/uploaded from the partner verification flow/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/\/api\/backend\/verification-cases\/verify-.*\/documents\/doc-/)).toBeVisible();

    await page.getByRole("button", { name: /business document/i }).click();
    await expect(page.getByText("business-registration.pdf").first()).toBeVisible();
    await page
      .getByPlaceholder("Add approval rationale, rejection reason, or resubmission guidance...")
      .fill("Please upload a clearer registration certificate.");
    await page.getByRole("button", { name: "Request more info" }).click();

    await expect(
      page.getByText("Partner remains pending and receives a request for more information."),
    ).toBeVisible();
    await expect(page.getByText(/verification_more_info/i)).toBeVisible();
    await expect(page.getByText("More information requested").first()).toBeVisible();
  });
});
