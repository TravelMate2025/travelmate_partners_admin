import { getVerificationCases } from "@/modules/verification-review/data";
import { applyVerificationDecision, isVerificationDecisionAllowed } from "@/modules/verification-review/reducer";

describe("verification review reducer", () => {
  it("approves pending or in-review cases and moves lifecycle to verified", () => {
    const updated = applyVerificationDecision(getVerificationCases(), {
      caseId: "verify-001",
      action: "approve",
      note: "Documents verified.",
      actor: "Reviewer lane",
    });

    const target = updated.find((item) => item.id === "verify-001");
    expect(target?.verificationStatus).toBe("approved");
    expect(target?.lifecycleState).toBe("verified");
  });

  it("requests more information without rejecting the partner lifecycle", () => {
    const updated = applyVerificationDecision(getVerificationCases(), {
      caseId: "verify-002",
      action: "request_more_info",
      note: "Please upload the tax certificate again.",
      actor: "Reviewer lane",
    });

    const target = updated.find((item) => item.id === "verify-002");
    expect(target?.verificationStatus).toBe("in_review");
    expect(target?.lifecycleState).toBe("pending");
  });

  it("suspends only admin lifecycle state for approved cases", () => {
    const updated = applyVerificationDecision(getVerificationCases(), {
      caseId: "verify-003",
      action: "suspend",
      note: "Temporary compliance hold.",
      actor: "Operations",
    });

    const target = updated.find((item) => item.id === "verify-003");
    expect(target?.verificationStatus).toBe("approved");
    expect(target?.lifecycleState).toBe("suspended");
  });

  it("exposes allowed actions from the current case state", () => {
    const cases = getVerificationCases();

    expect(isVerificationDecisionAllowed(cases[0], "approve")).toBe(true);
    expect(isVerificationDecisionAllowed(cases[0], "suspend")).toBe(false);
    expect(isVerificationDecisionAllowed(cases[2], "approve")).toBe(false);
    expect(isVerificationDecisionAllowed(cases[2], "suspend")).toBe(true);
  });
});
