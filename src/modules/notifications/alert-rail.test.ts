import { describe, expect, it } from "vitest";

import { extractNotificationRecords, getNewNotificationRecords } from "@/modules/notifications/alert-rail";
import type { NotificationRecord } from "@/modules/notifications/types";

function makeRecord(id: string): NotificationRecord {
  return {
    id,
    title: `Notification ${id}`,
    body: "Body",
    kind: "transactional",
    status: "sent",
    audienceSegment: "verified_partners",
    region: null,
    channels: ["in_app"],
    targetPartnerCount: 1,
    createdAt: "2026-04-28T00:00:00.000Z",
    createdBy: "Ops User",
    summary: "Summary",
    deliveryMetadata: null,
    operationalNote: "",
    history: [],
    latestAuditRecord: null,
  };
}

describe("notifications alert rail", () => {
  it("extracts records from valid envelope", () => {
    const records = [makeRecord("n-1"), makeRecord("n-2")];
    expect(extractNotificationRecords({ data: records })).toEqual(records);
    expect(extractNotificationRecords({})).toEqual([]);
    expect(extractNotificationRecords(null)).toEqual([]);
  });

  it("returns only unseen records", () => {
    const records = [makeRecord("n-1"), makeRecord("n-2"), makeRecord("n-3")];
    const seen = new Set(["n-1", "n-3"]);
    const unseen = getNewNotificationRecords(records, seen);
    expect(unseen.map((item) => item.id)).toEqual(["n-2"]);
  });
});
