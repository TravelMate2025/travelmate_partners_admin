import { afterEach, beforeEach, vi } from "vitest";

import { getVerificationCases } from "@/modules/verification-review/data";
import {
  mockVerificationReviewRepository,
  realVerificationReviewRepository,
} from "@/modules/verification-review/service";

const fetchMock = vi.fn();

describe("mockVerificationReviewRepository", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

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

  it("submits real verification decisions through the backend proxy route", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          cases: [
            {
              ...getVerificationCases()[0],
              verificationStatus: "approved",
              lifecycleState: "verified",
            },
          ],
          auditRecord: {
            eventId: "audit-1",
            actor: "Reviewer lane",
            caseId: "verify-001",
            action: "approve",
            summary: "Reviewer lane executed approve for verification case verify-001.",
            status: "queued_for_backend",
          },
          partnerNotification: {
            partnerName: "Amina Yusuf",
            caseId: "verify-001",
            channel: "email",
            template: "verification_approved",
            deliveryStatus: "queued_for_backend",
            summary: "Partner is notified of approval.",
          },
        },
      }),
    });

    const result = await realVerificationReviewRepository.submitDecision([], {
      caseId: "verify-001",
      action: "approve",
      note: "Everything checks out.",
      actor: "Reviewer lane",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/backend/verification-cases/verify-001/decision",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result.cases[0].latestAuditRecord?.action).toBe("approve");
    expect(result.cases[0].latestPartnerNotification?.template).toBe("verification_approved");
  });
});
