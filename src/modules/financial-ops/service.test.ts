import { getFinancialOpsRecords } from "@/modules/financial-ops/data";
import { mockFinancialOpsRepository } from "@/modules/financial-ops/service";

describe("financial-ops service", () => {
  it("retries a failed settlement run and clears the failure reason", async () => {
    const result = await mockFinancialOpsRepository.applyAction(
      getFinancialOpsRecords(),
      {
        caseId: "fin-001",
        action: "retry_settlement",
        actor: "Tunde Adebayo",
        note: "Retrying the payout batch after documenting the reconciliation exception.",
      },
      "finance",
    );

    expect(result.updatedRecord.adminRunStatus).toBe("processing");
    expect(result.updatedRecord.partnerSettlementStatus).toBe("processing");
    expect(result.updatedRecord.failureReason).toBeNull();
  });

  it("queues partner refund follow-up and then records refund recovery", async () => {
    const notified = await mockFinancialOpsRepository.applyAction(
      getFinancialOpsRecords(),
      {
        caseId: "fin-002",
        action: "notify_partner_refund",
        actor: "Tunde Adebayo",
        note: "Queueing partner refund follow-up before finance closes the reverse settlement trail.",
      },
      "finance",
    );

    expect(notified.updatedRecord.refundStatus).toBe("partner_notified");

    const recovered = await mockFinancialOpsRepository.applyAction(
      notified.records,
      {
        caseId: "fin-002",
        action: "recover_refund",
        actor: "Tunde Adebayo",
        note: "Recording refund recovery after partner acknowledgement and finance confirmation.",
      },
      "finance",
    );

    expect(recovered.updatedRecord.refundStatus).toBe("recovered");
    expect(recovered.updatedRecord.reconciliationDeltaAmount).toBe(0);
  });

  it("generates a settlement statement for a completed payout", async () => {
    const result = await mockFinancialOpsRepository.applyAction(
      getFinancialOpsRecords(),
      {
        caseId: "fin-003",
        action: "generate_statement",
        actor: "Tunde Adebayo",
        note: "Generating the partner settlement statement for the completed weekly payout.",
      },
      "finance",
    );

    expect(result.updatedRecord.statements[0]?.status).toBe("queued_for_backend");
    expect(result.auditRecord.summary).toContain("generated a settlement statement");
  });
});
