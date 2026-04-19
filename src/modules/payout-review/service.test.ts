import { getPayoutReviewRecords } from "@/modules/payout-review/data";
import { mockPayoutReviewRepository } from "@/modules/payout-review/service";

describe("payout-review service", () => {
  it("approves a pending payout method and clears the settlement hold", async () => {
    const result = await mockPayoutReviewRepository.applyAction(
      getPayoutReviewRecords(),
      {
        caseId: "payout-001",
        action: "approve_payout_method",
        actor: "Tunde Adebayo",
        note: "Ownership and account metadata are confirmed, so finance can release this payout method.",
        reasonCode: "ownership_confirmed",
      },
      "finance",
    );

    expect(result.updatedRecord.status).toBe("verified");
    expect(result.updatedRecord.holdState).toBe("clear");
    expect(result.updatedRecord.settlementReadiness).toBe("ready");
  });

  it("rejects a pending payout method when ownership mismatches remain unresolved", async () => {
    const result = await mockPayoutReviewRepository.applyAction(
      getPayoutReviewRecords(),
      {
        caseId: "payout-002",
        action: "reject_payout_method",
        actor: "Tunde Adebayo",
        note: "The holder details still mismatch the verified business profile, so this method must be rejected.",
        reasonCode: "name_mismatch",
      },
      "finance",
    );

    expect(result.updatedRecord.status).toBe("rejected");
    expect(result.updatedRecord.rejectionReason).toBe("Name mismatch");
    expect(result.auditRecord.summary).toContain("rejected payout method");
  });

  it("reverifies a previously approved payout method and reactivates the hold", async () => {
    const result = await mockPayoutReviewRepository.applyAction(
      getPayoutReviewRecords(),
      {
        caseId: "payout-003",
        action: "reverify_payout_method",
        actor: "Tunde Adebayo",
        note: "The new fraud pattern requires the verified payout method to return to review before settlement continues.",
        reasonCode: "rapid_account_change",
      },
      "finance",
    );

    expect(result.updatedRecord.status).toBe("pending");
    expect(result.updatedRecord.holdState).toBe("active");
    expect(result.updatedRecord.settlementReadiness).toBe("review_required");
  });
});
