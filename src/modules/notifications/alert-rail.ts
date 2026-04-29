import type { NotificationRecord } from "@/modules/notifications/types";

type NotificationsEnvelope = {
  data?: NotificationRecord[];
};

export function readSeenNotificationIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  const raw = window.sessionStorage.getItem("tm_admin_seen_notifications_v1");
  if (!raw) {
    return new Set<string>();
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

export function writeSeenNotificationIds(ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem("tm_admin_seen_notifications_v1", JSON.stringify([...ids]));
}

export function extractNotificationRecords(payload: unknown) {
  const envelope = payload as NotificationsEnvelope | null;
  if (!envelope || !Array.isArray(envelope.data)) {
    return [];
  }
  return envelope.data;
}

export function getNewNotificationRecords(records: NotificationRecord[], seenIds: Set<string>) {
  return records.filter((record) => !seenIds.has(record.id));
}
