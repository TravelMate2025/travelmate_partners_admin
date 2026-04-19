import { getPartnerRecords } from "@/modules/partner-operations/data";
import { mockPartnerOperationsRepository } from "@/modules/partner-operations/service";

describe("mockPartnerOperationsRepository", () => {
  it("updates partner metadata and returns an audit message", async () => {
    const result = await mockPartnerOperationsRepository.applyAction(
      getPartnerRecords(),
      {
        type: "update_metadata",
        partnerId: "partner-001",
        actor: "Operations Admin",
        note: "Escalated to strategic partner coverage.",
        metadata: {
          marketOwner: "Strategic Supply Team",
          supportTier: "strategic",
          priority: "priority",
        },
      },
      "operations",
    );

    expect(result.updatedRecord.metadata.marketOwner).toBe("Strategic Supply Team");
    expect(result.updatedRecord.history[0]?.action).toBe("Metadata updated");
    expect(result.auditMessage).toContain("update_metadata");
  });

  it("rejects restore attempts for roles without restore policy", async () => {
    await expect(
      mockPartnerOperationsRepository.applyAction(
        getPartnerRecords(),
        {
          type: "restore",
          partnerId: "partner-003",
          actor: "Support Admin",
          note: "Attempting restore without policy.",
        },
        "support",
      ),
    ).rejects.toThrow("Action restore is not allowed for partner partner-003.");
  });
});
