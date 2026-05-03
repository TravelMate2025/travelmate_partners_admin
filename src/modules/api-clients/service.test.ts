import { getApiClientRecords } from "@/modules/api-clients/data";
import { mockApiClientsRepository } from "@/modules/api-clients/service";

describe("mockApiClientsRepository", () => {
  it("starts review then approves pending API clients with the selected plan and quota", async () => {
    const reviewResult = await mockApiClientsRepository.applyAction(
      getApiClientRecords(),
      {
        actor: "Operations Admin",
        clientId: "api-client-001",
        action: "start_review",
        note: "Initial intake review started after basic compliance checks.",
        plan: "starter",
        rateLimitPerMinute: 120,
        policyEnvironment: "sandbox",
        policyTier: "standard",
        policyScopes: ["inventory.read"],
        policyProducts: ["stays"],
        policyAlertProfile: "balanced",
        reasonCode: "",
      },
      "operations",
    );

    const result = await mockApiClientsRepository.applyAction(
      reviewResult.records,
      {
        actor: "Operations Admin",
        clientId: "api-client-001",
        action: "approve_client",
        note: "Approved after use-case verification and plan fit review.",
        plan: "starter",
        rateLimitPerMinute: 120,
        policyEnvironment: "production",
        policyTier: "elevated",
        policyScopes: ["inventory.read", "pricing.read", "bookings.read"],
        policyProducts: ["stays", "transfers"],
        policyAlertProfile: "balanced",
        reasonCode: "",
      },
      "operations",
    );

    expect(result.updatedRecord.status).toBe("approved");
    expect(result.updatedRecord.plan).toBe("starter");
    expect(result.updatedRecord.usage.rateLimitPerMinute).toBe(120);
    expect(result.auditRecord.status).toBe("queued_for_backend");
  });

  it("issues a key for approved clients", async () => {
    const result = await mockApiClientsRepository.applyAction(
      getApiClientRecords(),
      {
        actor: "Operations Admin",
        clientId: "api-client-002",
        action: "issue_key",
        note: "Issued first production key after approval.",
        plan: "starter",
        rateLimitPerMinute: 80,
        policyEnvironment: "production",
        policyTier: "elevated",
        policyScopes: ["inventory.read", "pricing.read", "bookings.read"],
        policyProducts: ["stays", "transfers"],
        policyAlertProfile: "balanced",
        reasonCode: "",
      },
      "operations",
    );

    expect(result.updatedRecord.keyStatus).toBe("active");
    expect(result.updatedRecord.usage.rateLimitPerMinute).toBe(80);
  });

  it("regenerates keys for previously issued clients", async () => {
    const result = await mockApiClientsRepository.applyAction(
      getApiClientRecords(),
      {
        actor: "Operations Admin",
        clientId: "api-client-003",
        action: "regenerate_key",
        note: "Rotated the key after elevated error-rate investigation.",
        plan: "enterprise",
        rateLimitPerMinute: 900,
        policyEnvironment: "production",
        policyTier: "strategic",
        policyScopes: ["inventory.read", "pricing.read", "bookings.read"],
        policyProducts: ["stays", "transfers"],
        policyAlertProfile: "strict",
        reasonCode: "credential_rotation",
      },
      "operations",
    );

    expect(result.updatedRecord.keyStatus).toBe("active");
    expect(result.updatedRecord.history[0]?.action).toBe("Key regenerated");
  });

  it("rejects ineligible plans before mutating state", async () => {
    await expect(
      mockApiClientsRepository.applyAction(
        getApiClientRecords(),
        {
          actor: "Operations Admin",
          clientId: "api-client-001",
          action: "approve_client",
          note: "Attempted enterprise approval without eligibility.",
          plan: "enterprise",
          rateLimitPerMinute: 300,
          policyEnvironment: "production",
          policyTier: "elevated",
          policyScopes: ["inventory.read", "pricing.read", "bookings.read"],
          policyProducts: ["stays", "transfers"],
          policyAlertProfile: "balanced",
          reasonCode: "",
        },
        "operations",
      ),
    ).rejects.toThrow(/not eligible/i);
  });

  it("rejects invalid rate limits before mutating state", async () => {
    await expect(
      mockApiClientsRepository.applyAction(
        getApiClientRecords(),
        {
          actor: "Operations Admin",
          clientId: "api-client-002",
          action: "update_plan",
          note: "Attempted invalid quota override.",
          plan: "starter",
          rateLimitPerMinute: 999,
          policyEnvironment: "production",
          policyTier: "elevated",
          policyScopes: ["inventory.read", "pricing.read", "bookings.read"],
          policyProducts: ["stays", "transfers"],
          policyAlertProfile: "balanced",
          reasonCode: "",
        },
        "operations",
      ),
    ).rejects.toThrow(/between 10 and 120/i);
  });
});
