import { canSendNotification, validateNotificationPayload } from "@/modules/notifications/rules";
import type {
  NotificationActionPayload,
  NotificationActionResult,
  NotificationAudienceSegment,
  NotificationChannel,
  NotificationRecord,
} from "@/modules/notifications/types";
import type { AdminRole } from "@/modules/auth/types";

function formatTimestamp(date: string) {
  return new Date(date)
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
    .replace(",", " UTC");
}

function targetSummary(segment: NotificationAudienceSegment, region: string | null) {
  switch (segment) {
    case "all_partners":
      return "all partners";
    case "verified_partners":
      return "verified partners";
    case "watchlist":
      return "watchlist partners";
    case "api_clients":
      return "API client partners";
    case "region":
      return region ? `${region} partners` : "regional partners";
  }
}

function estimatedTargetCount(segment: NotificationAudienceSegment, region: string | null) {
  switch (segment) {
    case "all_partners":
      return 240;
    case "verified_partners":
      return 184;
    case "watchlist":
      return 19;
    case "api_clients":
      return 12;
    case "region":
      return region === "East Africa" ? 42 : 27;
  }
}

function buildAuditSummary(actor: string, title: string) {
  return `${actor} queued partner notification ${title} for backend delivery.`;
}

export type NotificationsRepository = {
  applyAction(
    records: NotificationRecord[],
    payload: NotificationActionPayload,
    role: AdminRole,
  ): Promise<NotificationActionResult>;
};

type NotificationsSendEnvelope = {
  data?: {
    record?: NotificationRecord;
    auditRecord?: NotificationActionResult["auditRecord"];
  };
  message?: string;
  error?: { message?: string };
};

export const mockNotificationsRepository: NotificationsRepository = {
  async applyAction(records, payload, role) {
    const record = records.find((item) => item.id === payload.notificationId);

    if (!record) {
      throw new Error("Selected notification draft was not found.");
    }

    if (!canSendNotification(role, { ...record, kind: payload.kind })) {
      throw new Error("This notification cannot be sent with the current role and message type.");
    }

    const validationError = validateNotificationPayload(payload, role);
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamp = new Date().toISOString();
    const target = targetSummary(payload.audienceSegment, payload.region);
    const targetCount = estimatedTargetCount(payload.audienceSegment, payload.region);
    const formattedTimestamp = formatTimestamp(timestamp);

    const updatedRecord = {
      ...record,
      title: payload.title.trim(),
      body: payload.body.trim(),
      kind: payload.kind,
      status: "sent" as const,
      audienceSegment: payload.audienceSegment,
      region: payload.region,
      channels: payload.channels,
      targetPartnerCount: targetCount,
      operationalNote: payload.note.trim(),
      summary: `Queued ${payload.kind} message for ${target} across ${payload.channels.join(", ")} pending backend dispatch.`,
      deliveryMetadata: {
        deliveredCount: null,
        failedCount: null,
        channels: payload.channels,
        targetSummary: target,
        sentAt: formattedTimestamp,
        dispatchStatus: "queued_for_backend" as const,
        estimatedTargetCount: targetCount,
        isEstimated: true,
      },
      history: [
        {
          id: `notifications-history-${record.id}-${Date.now()}`,
          actor: payload.actor,
          action: "Message queued",
          timestamp: formattedTimestamp,
          note: `${payload.note.trim()} Backend delivery dispatch is still pending confirmation.`,
        },
        ...record.history,
      ],
      latestAuditRecord: {
        eventId: `notifications-audit-${record.id}-${Date.now()}`,
        actor: payload.actor,
        notificationId: record.id,
        action: "send_message" as const,
        summary: buildAuditSummary(payload.actor, payload.title.trim()),
        status: "queued_for_backend" as const,
        kind: payload.kind,
        targetSegment: payload.audienceSegment,
        region: payload.region,
        targetSummary: target,
        targetPartnerCount: targetCount,
        deliveredCount: null,
        failedCount: null,
        sentAt: formattedTimestamp,
        channels: payload.channels,
      },
    };

    return {
      records: records.map((item) => (item.id === record.id ? updatedRecord : item)),
      updatedRecord,
      auditRecord: updatedRecord.latestAuditRecord,
    };
  },
};

export const realNotificationsRepository: NotificationsRepository = {
  async applyAction(records, payload, role) {
    const selected = records.find((item) => item.id === payload.notificationId) ?? records[0];
    if (!selected) {
      throw new Error("No notification draft is available to send.");
    }
    if (!canSendNotification(role, { ...selected, kind: payload.kind })) {
      throw new Error("This notification cannot be sent with the current role and message type.");
    }

    const validationError = validateNotificationPayload(payload, role);
    if (validationError) {
      throw new Error(validationError);
    }

    const response = await fetch("/api/backend/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        kind: payload.kind,
        audienceSegment: payload.audienceSegment,
        region: payload.region,
        channels: payload.channels,
        note: payload.note,
      }),
    });

    const body = (await response.json().catch(() => null)) as NotificationsSendEnvelope | null;
    if (!response.ok || !body?.data?.record || !body.data.auditRecord) {
      throw new Error(
        body?.message ??
          body?.error?.message ??
          "Unable to send partner message.",
      );
    }

    const updatedRecord = body.data.record;
    const auditRecord = body.data.auditRecord;

    const existingIndex = records.findIndex((item) => item.id === updatedRecord.id);
    const nextRecords = [...records];
    if (existingIndex >= 0) {
      nextRecords[existingIndex] = updatedRecord;
    } else {
      nextRecords.unshift(updatedRecord);
    }

    return {
      records: nextRecords,
      updatedRecord,
      auditRecord,
    };
  },
};
