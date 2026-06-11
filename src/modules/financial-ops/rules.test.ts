import {
  buildFinancialOpsSummary,
  getAvailableFinancialOpsActions,
  getFinancialOpsPolicy,
  matchesFinancialOpsFilter,
  validateFinancialOpsAction,
} from "@/modules/financial-ops/rules";
import { getFinancialOpsRecords } from "@/modules/financial-ops/data";

describe("financial-ops rules", () => {
  const records = getFinancialOpsRecords();

  it("grants finance roles full settlement operations access", () => {
    const policy = getFinancialOpsPolicy("finance");
    expect(policy.canRetryRun).toBe(true);
    expect(policy.canGenerateStatements).toBe(true);
  });

  it("offers retry and reconcile actions for failed settlement cases", () => {
    const actions = getAvailableFinancialOpsActions(records[0], "finance");
    expect(actions).toContain("retry_settlement");
    expect(actions).toContain("reconcile_case");
    expect(actions).not.toContain("mark_settlement_paid");
  });

  it("blocks mark paid until reconciliation delta is cleared", () => {
    const processingWithDelta = {
      ...records[0],
      partnerSettlementStatus: "processing" as const,
      adminRunStatus: "processing" as const,
    };

    expect(getAvailableFinancialOpsActions(processingWithDelta, "finance")).not.toContain("mark_settlement_paid");
    expect(
      validateFinancialOpsAction(
        processingWithDelta,
        "mark_settlement_paid",
        "finance",
        "Trying to complete payout before reconciling the remaining delta.",
      ),
    ).toBe("Reconcile the settlement delta before marking this settlement paid.");
  });

  it("offers refund follow-up actions only when refund work is active", () => {
    const actions = getAvailableFinancialOpsActions(records[1], "finance");
    expect(actions).toContain("notify_partner_refund");
    expect(actions).not.toContain("recover_refund");
  });

  it("blocks recovery before partner refund notification", () => {
    expect(validateFinancialOpsAction(records[1], "recover_refund", "finance", "Recovering this refund now.")).toBe(
      "Refund recovery is only available after partner notification or during a dispute.",
    );
  });

  it("filters settlement cases by run status and region", () => {
    const filtered = records.filter((record) =>
      matchesFinancialOpsFilter(record, {
        query: "",
        partnerSettlementStatus: "all",
        adminRunStatus: "failed",
        refundStatus: "all",
        region: "East Africa",
      }),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("fin-001");
  });

  it("builds finance dashboard summary counts", () => {
    expect(buildFinancialOpsSummary(records)).toEqual({
      settlementExceptions: 2,
      refundFollowUps: 1,
      unbalancedCases: 2,
      statementsPending: 2,
    });
  });
});
