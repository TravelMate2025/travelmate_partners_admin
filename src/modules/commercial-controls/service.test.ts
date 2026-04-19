import { getCommercialControlRecords } from "@/modules/commercial-controls/data";
import { mockCommercialControlsRepository } from "@/modules/commercial-controls/service";

describe("commercial-controls service", () => {
  it("updates commercial rules with audit output and downstream visibility", async () => {
    const records = getCommercialControlRecords();
    const result = await mockCommercialControlsRepository.applyAction(
      records,
      {
        actor: "Tunde Adebayo",
        ruleId: "commercial-rule-001",
        action: "update_rule",
        note: "Raised global stay economics after quarterly finance review.",
        commissionRatePercent: 15,
        serviceFeeFlatAmount: 4,
        effectiveDate: "2026-05-01",
      },
      "finance",
    );

    expect(result.updatedRecord.commissionRatePercent).toBe(15);
    expect(result.updatedRecord.serviceFeeFlatAmount).toBe(3);
    expect(result.updatedRecord.partnerSettings[0]?.commissionRatePercent).toBe(15);
    expect(result.auditRecord.ruleChangeDetails).toEqual({
      ruleType: "commission",
      previousValue: 14,
      nextValue: 15,
      effectiveDate: "2026-05-01",
    });
    expect(result.auditRecord.summary).toMatch(/updated commercial rule/i);
  });

  it("records manual adjustments in history", async () => {
    const records = getCommercialControlRecords();
    const result = await mockCommercialControlsRepository.applyAction(
      records,
      {
        actor: "Tunde Adebayo",
        ruleId: "commercial-rule-003",
        action: "create_adjustment",
        note: "Recorded corrective rebate after enterprise pricing variance review.",
        partnerName: "VoyageStack Labs",
        direction: "credit",
        amount: 220,
        reason: "Enterprise rebate",
      },
      "finance",
    );

    expect(result.updatedRecord.manualAdjustmentHistory[0]?.partnerName).toBe("VoyageStack Labs");
    expect(result.updatedRecord.manualAdjustmentHistory[0]?.amount).toBe(220);
    expect(result.auditRecord.adjustmentDetails).toEqual({
      partnerName: "VoyageStack Labs",
      direction: "credit",
      amount: 220,
      currency: "USD",
      reason: "Enterprise rebate",
    });
    expect(result.auditRecord.status).toBe("queued_for_backend");
  });
});
