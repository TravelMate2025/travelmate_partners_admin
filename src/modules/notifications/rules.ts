import type { AdminRole } from "@/modules/auth/types";
import type {
  NotificationActionPayload,
  NotificationFilterState,
  NotificationRecord,
  NotificationsPolicy,
} from "@/modules/notifications/types";

export const notificationsAllowedRoles: AdminRole[] = ["super_admin", "operations", "support", "finance"];

export function getNotificationsPolicy(role: AdminRole): NotificationsPolicy {
  const canSendMessages = role !== "reviewer";
  const canBroadcast = role === "support" || role === "operations" || role === "super_admin";

  return {
    canSendMessages,
    canBroadcast,
    summary: canBroadcast
      ? "This role can send direct, transactional, and broadcast partner communications with delivery logging."
      : canSendMessages
        ? "This role can send direct and transactional partner communications. Broadcasts remain restricted."
        : "This role can review communication history but cannot send partner-facing messages.",
    allowedRoles: notificationsAllowedRoles,
  };
}

export function canSendNotification(role: AdminRole, record: NotificationRecord) {
  const policy = getNotificationsPolicy(role);

  if (!policy.canSendMessages) {
    return false;
  }

  if (record.kind === "broadcast" && !policy.canBroadcast) {
    return false;
  }

  return true;
}

export function validateNotificationPayload(payload: NotificationActionPayload, role: AdminRole) {
  const policy = getNotificationsPolicy(role);

  if (!policy.canSendMessages) {
    return "This role cannot send partner-facing messages.";
  }

  if (payload.kind === "broadcast" && !policy.canBroadcast) {
    return "Broadcast notifications are restricted to operations, support, and super admin roles.";
  }

  if (payload.title.trim().length < 8) {
    return "Add a clear notification title before sending.";
  }

  if (payload.body.trim().length < 24) {
    return "Notification body must explain the partner-facing message clearly.";
  }

  if (payload.channels.length === 0) {
    return "Select at least one delivery channel.";
  }

  if (payload.audienceSegment === "region" && (!payload.region || payload.region.trim().length === 0)) {
    return "Choose a region when sending a region-targeted message.";
  }

  if (payload.note.trim().length < 12) {
    return "Add an internal audit note before sending a message.";
  }

  return null;
}

export function buildNotificationsSummary(records: NotificationRecord[]) {
  return {
    drafts: records.filter((record) => record.status === "draft").length,
    sent: records.filter((record) => record.status === "sent").length,
    broadcasts: records.filter((record) => record.kind === "broadcast").length,
    failedDeliveries: records.reduce((total, record) => total + (record.deliveryMetadata?.failedCount ?? 0), 0),
  };
}

export function matchesNotificationFilter(record: NotificationRecord, filters: NotificationFilterState) {
  const query = filters.query.trim().toLowerCase();
  const matchesQuery =
    query.length === 0 ||
    record.title.toLowerCase().includes(query) ||
    record.summary.toLowerCase().includes(query) ||
    record.createdBy.toLowerCase().includes(query);

  const matchesKind = filters.kind === "all" || record.kind === filters.kind;
  const matchesStatus = filters.status === "all" || record.status === filters.status;
  const matchesChannel = filters.channel === "all" || record.channels.includes(filters.channel);

  return matchesQuery && matchesKind && matchesStatus && matchesChannel;
}
