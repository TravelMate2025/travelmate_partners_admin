import { canApplyCommercialAction, validateCommercialAdjustment, validateCommercialRuleUpdate } from "@/modules/commercial-controls/rules";
import { getCommercialControlRecords } from "@/modules/commercial-controls/data";

describe("commercial-controls rules", () => {
  const record = getCommercialControlRecords()[0];

  it("validates commercial rule updates", () => {
    expect(
      validateCommercialRuleUpdate(
        {
          actor: "Finance Admin",
          ruleId: record.id,
          action: "update_rule",
          note: "Raise stay margin to protect payout forecasts.",
          commissionRatePercent: 15,
          serviceFeeFlatAmount: 4,
          effectiveDate: "2026-05-01",
        },
        record,
      ),
    ).toBeNull();

    expect(
      validateCommercialRuleUpdate(
        {
          actor: "Finance Admin",
          ruleId: record.id,
          action: "update_rule",
          note: "short",
          commissionRatePercent: 42,
          serviceFeeFlatAmount: 4,
          effectiveDate: "",
        },
        record,
      ),
    ).toBe("Commission rate must stay between 0% and 35%.");
  });

  it("validates manual adjustment payloads and role permissions", () => {
    expect(
      validateCommercialAdjustment(
        {
          actor: "Finance Admin",
          ruleId: record.id,
          action: "create_adjustment",
          note: "Applied rebate recovery after campaign exception review.",
          partnerName: "Lagos Stay Collective",
          direction: "credit",
          amount: 150,
          reason: "Campaign rebate",
        },
        record,
      ),
    ).toBeNull();

    expect(
      validateCommercialAdjustment(
        {
          actor: "Finance Admin",
          ruleId: record.id,
          action: "create_adjustment",
          note: "Too short",
          partnerName: "Unknown Partner",
          direction: "credit",
          amount: -5,
          reason: "no",
        },
        record,
      ),
    ).toBe("Manual adjustments must target a partner linked to the selected commercial rule.");

    expect(canApplyCommercialAction("finance", record, "update_rule")).toBe(true);
    expect(canApplyCommercialAction("operations", record, "update_rule")).toBe(false);
  });
});
