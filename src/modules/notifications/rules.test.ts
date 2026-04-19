import { canSendNotification, notificationsAllowedRoles, validateNotificationPayload } from "@/modules/notifications/rules";
import { getNotificationRecords } from "@/modules/notifications/data";

describe("notifications rules", () => {
  const record = getNotificationRecords()[0];

  it("validates audience and channel requirements", () => {
    expect(
      validateNotificationPayload(
        {
          actor: "Maya Singh",
          notificationId: record.id,
          action: "send_message",
          title: "Verified partner payout notice",
          body: "Statements now arrive each Tuesday by 10:00 UTC. Review your dashboard for the updated schedule.",
          kind: "broadcast",
          audienceSegment: "verified_partners",
          region: null,
          channels: ["email", "in_app"],
          note: "Sending after finance confirmed the revised payout timeline.",
        },
        "support",
      ),
    ).toBeNull();

    expect(
      validateNotificationPayload(
        {
          actor: "Finance Admin",
          notificationId: record.id,
          action: "send_message",
          title: "short",
          body: "Too short",
          kind: "broadcast",
          audienceSegment: "region",
          region: null,
          channels: [],
          note: "short",
        },
        "finance",
      ),
    ).toBe("Broadcast notifications are restricted to operations, support, and super admin roles.");
  });

  it("enforces role-aware sending", () => {
    expect(canSendNotification("support", record)).toBe(true);
    expect(canSendNotification("finance", record)).toBe(false);
    expect(canSendNotification("reviewer", { ...record, kind: "direct" })).toBe(false);
  });

  it("exposes route-safe allowed roles for the notifications surface", () => {
    expect(notificationsAllowedRoles).toEqual(["super_admin", "operations", "support", "finance"]);
  });
});
