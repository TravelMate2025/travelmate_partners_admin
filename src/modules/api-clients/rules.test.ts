import { getApiClientRecords } from "@/modules/api-clients/data";
import {
  canApplyApiClientAction,
  getApiClientsPolicy,
  isEligibleApiPlan,
  validateApiClientActionPayload,
  validateApiRateLimit,
} from "@/modules/api-clients/rules";

describe("api clients rules", () => {
  it("allows operations to start review for pending applications", () => {
    const pendingClient = getApiClientRecords().find((record) => record.status === "pending_review");

    expect(pendingClient).toBeDefined();
    expect(getApiClientsPolicy("operations").canApprove).toBe(true);
    expect(canApplyApiClientAction("operations", pendingClient!, "start_review")).toBe(true);
    expect(canApplyApiClientAction("operations", pendingClient!, "approve_client")).toBe(false);
  });

  it("limits support to containment actions", () => {
    const activeClient = getApiClientRecords().find((record) => record.keyStatus === "active");

    expect(activeClient).toBeDefined();
    expect(getApiClientsPolicy("support").canApprove).toBe(false);
    expect(canApplyApiClientAction("support", activeClient!, "revoke_key")).toBe(true);
    expect(canApplyApiClientAction("support", activeClient!, "update_plan")).toBe(false);
  });

  it("allows key regeneration once a client already has a key lifecycle", () => {
    const activeClient = getApiClientRecords().find((record) => record.keyStatus === "active");

    expect(activeClient).toBeDefined();
    expect(canApplyApiClientAction("operations", activeClient!, "regenerate_key")).toBe(true);
  });

  it("enforces plan eligibility and plan-specific rate bounds", () => {
    const pendingClient = getApiClientRecords().find((record) => record.id === "api-client-001");

    expect(pendingClient).toBeDefined();
    expect(isEligibleApiPlan(pendingClient!, "growth")).toBe(true);
    expect(isEligibleApiPlan(pendingClient!, "enterprise")).toBe(false);
    expect(validateApiRateLimit("starter", 121)).toMatch(/between 10 and 120/i);
    expect(validateApiRateLimit("growth", 180)).toBeNull();
  });

  it("requires review note for review decisions", () => {
    expect(
      validateApiClientActionPayload({
        actor: "Operations Admin",
        clientId: "api-client-001",
        action: "start_review",
        note: "short",
        plan: "starter",
        rateLimitPerMinute: 120,
        policyEnvironment: "sandbox",
        policyTier: "standard",
        policyScopes: ["inventory.read"],
        policyProducts: ["stays"],
        policyAlertProfile: "balanced",
        reasonCode: "",
      }),
    ).toMatch(/minimum 12 characters/i);

    expect(
      validateApiClientActionPayload({
        actor: "Operations Admin",
        clientId: "api-client-001",
        action: "issue_key",
        note: "short",
        plan: "starter",
        rateLimitPerMinute: 80,
        policyEnvironment: "sandbox",
        policyTier: "standard",
        policyScopes: ["inventory.read"],
        policyProducts: ["stays"],
        policyAlertProfile: "balanced",
        reasonCode: "",
      }),
    ).toBeNull();
  });
});
