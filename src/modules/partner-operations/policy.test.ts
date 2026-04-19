import { canApplyPartnerAction, getPartnerPolicy } from "@/modules/partner-operations/policy";
import { getPartnerRecords } from "@/modules/partner-operations/data";

describe("partner operations policy", () => {
  it("allows operations to manage metadata and lifecycle account controls", () => {
    const policy = getPartnerPolicy("operations");

    expect(policy.canEditMetadata).toBe(true);
    expect(policy.canLock).toBe(true);
    expect(policy.canUnlock).toBe(true);
    expect(policy.canRestore).toBe(true);
  });

  it("keeps reviewer and finance roles read-only on partner controls", () => {
    const activePartner = getPartnerRecords()[0];

    expect(canApplyPartnerAction("reviewer", activePartner, "lock")).toBe(false);
    expect(canApplyPartnerAction("finance", activePartner, "lock")).toBe(false);
  });
});
