import { getVerificationCases } from "@/modules/verification-review/data";
import { mockVerificationReviewRepository } from "@/modules/verification-review/service";

describe("mockVerificationReviewRepository", () => {
  it("returns audit and partner notification metadata for Django wiring", async () => {
    const result = await mockVerificationReviewRepository.submitDecision(getVerificationCases(), {
      caseId: "verify-001",
      action: "approve",
      note: "Everything checks out.",
      actor: "Reviewer lane",
    });

    expect(result.auditRecord.status).toBe("queued_for_backend");
    expect(result.partnerNotification.deliveryStatus).toBe("queued_for_backend");
    expect(result.partnerNotification.template).toBe("verification_approved");
    const target = result.cases.find((item) => item.id === "verify-001");

    expect(target?.verificationStatus).toBe("approved");
    expect(target?.latestAuditRecord?.action).toBe("approve");
    expect(target?.latestPartnerNotification?.template).toBe("verification_approved");
  });

  it("rejects invalid decisions instead of silently no-oping", async () => {
    await expect(
      mockVerificationReviewRepository.submitDecision(getVerificationCases(), {
        caseId: "verify-003",
        action: "approve",
        note: "Trying to re-approve an approved case.",
        actor: "Reviewer lane",
      }),
    ).rejects.toThrow("Action approve is not allowed for verification case verify-003.");
  });
});
