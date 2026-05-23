import { getNotificationRecords } from "@/modules/notifications/data";
import { mockNotificationsRepository } from "@/modules/notifications/service";

describe("notifications service", () => {
  it("queues a message and records audit-ready delivery metadata", async () => {
    const records = getNotificationRecords();
    const result = await mockNotificationsRepository.applyAction(
      records,
      {
        actor: "Maya Singh",
        notificationId: "notification-001",
        action: "send_message",
        title: "Updated payout statement timeline for verified partners",
        body: "We have updated the payout statement publishing timeline for verified partners. Statements will now appear every Tuesday by 10:00 UTC.",
        kind: "broadcast",
        audienceSegment: "verified_partners",
        region: null,
        channels: ["email", "in_app"],
        note: "Sending after finance confirmed the revised payout timeline.",
      },
      "support",
    );

    expect(result.updatedRecord.status).toBe("sent");
    expect(result.updatedRecord.deliveryMetadata?.channels).toEqual(["email", "in_app"]);
    expect(result.updatedRecord.deliveryMetadata?.dispatchStatus).toBe("queued_for_backend");
    expect(result.updatedRecord.deliveryMetadata?.deliveredCount).toBeNull();
    expect(result.updatedRecord.deliveryMetadata?.estimatedTargetCount).toBe(184);
    expect(result.auditRecord.targetSegment).toBe("verified_partners");
    expect(result.auditRecord.targetPartnerCount).toBe(184);
    expect(result.auditRecord.region).toBeNull();
    expect(result.auditRecord.channels).toEqual(["email", "in_app"]);
  });

  it("returns selected partner label for partner-segment direct messages", async () => {
    const records = getNotificationRecords();
    const result = await mockNotificationsRepository.applyAction(
      records,
      {
        actor: "Maya Singh",
        notificationId: "notification-001",
        action: "send_message",
        title: "Appeal response",
        body: "We reviewed your appeal and documented the next actions for reinstatement.",
        kind: "direct",
        audienceSegment: "partner",
        region: null,
        partnerIds: ["partner-1"],
        partnerLabel: "Acme Travel Ltd (partner-1)",
        channels: ["in_app"],
        note: "Responding to a partner-specific appeal outcome.",
      },
      "support",
    );

    expect(result.updatedRecord.deliveryMetadata?.targetSummary).toBe("Acme Travel Ltd (partner-1)");
    expect(result.auditRecord.targetSegment).toBe("partner");
    expect(result.auditRecord.targetPartnerCount).toBe(1);
  });
});
