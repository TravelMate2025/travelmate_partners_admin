import { getListingModerationRecords } from "@/modules/listing-moderation/data";
import { mockListingModerationRepository } from "@/modules/listing-moderation/service";

describe("mockListingModerationRepository", () => {
  it("approves a pending listing and prepares audit and notification outputs", async () => {
    const result = await mockListingModerationRepository.applyAction(
      getListingModerationRecords(),
      {
        actor: "Reviewer lane",
        listingIds: ["listing-stay-001"],
        action: "approve",
        reasonCode: "content_quality",
        note: "Listing details are now sufficient for approval.",
      },
      "reviewer",
    );

    const updated = result.records.find((record) => record.id === "listing-stay-001");

    expect(updated?.status).toBe("approved");
    expect(updated?.latestAuditRecord?.status).toBe("queued_for_backend");
    expect(updated?.latestPartnerNotification?.template).toBe("listing_approved");
  });

  it("rejects invalid emergency unpublish attempts for reviewer role", async () => {
    await expect(
      mockListingModerationRepository.applyAction(
        getListingModerationRecords(),
        {
          actor: "Reviewer lane",
          listingIds: ["listing-stay-002"],
          action: "emergency_unpublish",
          reasonCode: "safety_risk",
          note: "Unsafe claim under review.",
        },
        "reviewer",
      ),
    ).rejects.toThrow(/not allowed/i);
  });

  it("supports bulk approval for multiple pending listings", async () => {
    const result = await mockListingModerationRepository.applyAction(
      getListingModerationRecords(),
      {
        actor: "Operations Admin",
        listingIds: ["listing-stay-001", "listing-transfer-001"],
        action: "approve",
        reasonCode: "content_quality",
        note: "Listings are complete and ready for publication review.",
      },
      "operations",
    );

    expect(result.updatedIds).toEqual(["listing-stay-001", "listing-transfer-001"]);
    expect(result.partnerNotifications).toHaveLength(2);
    expect(
      result.records
        .filter((record) => result.updatedIds.includes(record.id))
        .every((record) => record.status === "approved"),
    ).toBe(true);
  });
});
