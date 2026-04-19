import {
  getAvailablePayoutReviewActions,
  getVisiblePayoutFields,
  validatePayoutReviewAction,
} from "@/modules/payout-review/rules";
import { getPayoutReviewRecords } from "@/modules/payout-review/data";

describe("payout-review rules", () => {
  it("masks sensitive payout fields for super admins and reveals them for finance", () => {
    const record = getPayoutReviewRecords()[0];

    const maskedFields = getVisiblePayoutFields(record, "super_admin");
    const financeFields = getVisiblePayoutFields(record, "finance");

    expect(maskedFields.find((field) => field.label === "Account number")?.value).toContain("*");
    expect(financeFields.find((field) => field.label === "Account number")?.value).toBe("0123454831");
  });

  it("allows re-verification only when a verified payout method has qualifying risk signals", () => {
    const verifiedRecord = getPayoutReviewRecords()[2];
    const pendingRecord = getPayoutReviewRecords()[0];

    expect(getAvailablePayoutReviewActions(verifiedRecord, "finance")).toContain("reverify_payout_method");
    expect(getAvailablePayoutReviewActions(pendingRecord, "finance")).not.toContain("reverify_payout_method");
  });

  it("blocks releasing a settlement hold before verification is complete", () => {
    const record = getPayoutReviewRecords()[0];

    expect(
      validatePayoutReviewAction(
        record,
        "toggle_settlement_hold",
        "finance",
        "Attempting to release the hold before verification is complete.",
        "verification_incomplete",
      ),
    ).toBe("Settlement holds can only be released after the payout method is verified.");
  });

  it("requires reason codes that match the selected review action", () => {
    const record = getPayoutReviewRecords()[0];

    expect(
      validatePayoutReviewAction(
        record,
        "approve_payout_method",
        "finance",
        "Finance has confirmed the payout details and is ready to approve.",
        "name_mismatch",
      ),
    ).toBe("Choose a valid reason code for approve payout method.");
  });
});
