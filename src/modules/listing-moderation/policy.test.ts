import {
  canApplyModerationAction,
  getAllowedBulkModerationActions,
  getListingModerationPolicy,
} from "@/modules/listing-moderation/policy";
import { getListingModerationRecords } from "@/modules/listing-moderation/data";

describe("listing moderation policy", () => {
  it("grants emergency takedowns to operations but not reviewers", () => {
    const liveStay = getListingModerationRecords().find((record) => record.id === "listing-stay-002");
    const approvedStay = liveStay ? { ...liveStay, status: "approved" as const } : null;

    expect(liveStay).toBeDefined();
    expect(approvedStay).toBeDefined();
    expect(getListingModerationPolicy("operations").canEmergencyUnpublish).toBe(true);
    expect(getListingModerationPolicy("reviewer").canEmergencyUnpublish).toBe(false);
    expect(canApplyModerationAction("operations", liveStay!, "emergency_unpublish")).toBe(true);
    expect(canApplyModerationAction("operations", approvedStay!, "emergency_unpublish")).toBe(true);
    expect(canApplyModerationAction("reviewer", liveStay!, "emergency_unpublish")).toBe(false);
  });

  it("derives bulk actions from the full selected record set", () => {
    const records = getListingModerationRecords();
    const pendingSelections = records.filter((record) => record.status === "pending");
    const mixedSelections = records.filter((record) =>
      ["listing-stay-001", "listing-stay-002"].includes(record.id),
    );

    const pendingBulkActions = getAllowedBulkModerationActions("operations", pendingSelections);
    const mixedBulkActions = getAllowedBulkModerationActions("operations", mixedSelections);

    expect(pendingBulkActions.approve).toBe(true);
    expect(pendingBulkActions.reject).toBe(true);
    expect(pendingBulkActions.send_back).toBe(true);
    expect(mixedBulkActions.approve).toBe(false);
    expect(mixedBulkActions.emergency_unpublish).toBe(false);
    expect(mixedBulkActions.flag).toBe(true);
  });
});
