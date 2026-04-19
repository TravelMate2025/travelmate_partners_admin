import { getApiClientRecords } from "@/modules/api-clients/data";
import {
  canApplyApiClientAction,
  getApiClientsPolicy,
  isEligibleApiPlan,
  validateApiRateLimit,
} from "@/modules/api-clients/rules";

describe("api clients rules", () => {
  it("allows operations to approve pending applications", () => {
    const pendingClient = getApiClientRecords().find((record) => record.status === "pending_review");

    expect(pendingClient).toBeDefined();
    expect(getApiClientsPolicy("operations").canApprove).toBe(true);
    expect(canApplyApiClientAction("operations", pendingClient!, "approve_client")).toBe(true);
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
});
