import type { AdminRole } from "@/modules/auth/types";

export type NotificationKind = "direct" | "broadcast" | "transactional";
export type NotificationStatus = "draft" | "sent" | "failed";
export type NotificationChannel = "email" | "in_app" | "sms";
export type NotificationAudienceSegment = "all_partners" | "verified_partners" | "watchlist" | "api_clients" | "region" | "partner";
export type NotificationAction = "send_message";

export type NotificationDeliveryMetadata = {
  deliveredCount: number | null;
  failedCount: number | null;
  channels: NotificationChannel[];
  targetSummary: string;
  sentAt: string;
  dispatchStatus: "queued_for_backend" | "completed";
  estimatedTargetCount: number;
  isEstimated: boolean;
};

export type NotificationAuditRecord = {
  eventId: string;
  actor: string;
  notificationId: string;
  action: NotificationAction;
  summary: string;
  status: "queued_for_backend";
  kind: NotificationKind;
  targetSegment: NotificationAudienceSegment;
  region: string | null;
  targetSummary: string;
  targetPartnerCount: number;
  deliveredCount: number | null;
  failedCount: number | null;
  sentAt: string;
  channels: NotificationChannel[];
};

export type NotificationHistoryEntry = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  note: string;
};

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  status: NotificationStatus;
  audienceSegment: NotificationAudienceSegment;
  region: string | null;
  channels: NotificationChannel[];
  targetPartnerCount: number;
  createdAt: string;
  createdBy: string;
  summary: string;
  deliveryMetadata: NotificationDeliveryMetadata | null;
  operationalNote: string;
  source?: "admin_outbound" | "workflow_alert";
  routing?: {
    module?: string;
    href?: string;
    [key: string]: unknown;
  };
  history: NotificationHistoryEntry[];
  latestAuditRecord: NotificationAuditRecord | null;
};

export type NotificationFilterState = {
  query: string;
  kind: NotificationKind | "all";
  status: NotificationStatus | "all";
  channel: NotificationChannel | "all";
  source: "all" | "workflow_alert" | "admin_outbound";
};

export type NotificationsSurfaceState =
  | {
      status: "loading" | "error" | "exception";
      title: string;
      description: string;
    }
  | undefined;

export type NotificationActionPayload = {
  actor: string;
  notificationId: string;
  action: "send_message";
  title: string;
  body: string;
  kind: NotificationKind;
  audienceSegment: NotificationAudienceSegment;
  region: string | null;
  partnerIds?: string[];
  partnerLabel?: string | null;
  channels: NotificationChannel[];
  note: string;
};

export type NotificationActionResult = {
  records: NotificationRecord[];
  updatedRecord: NotificationRecord;
  auditRecord: NotificationAuditRecord;
};

export type NotificationsPolicy = {
  canSendMessages: boolean;
  canBroadcast: boolean;
  summary: string;
  allowedRoles: AdminRole[];
};

export type NotificationPartnerOption = {
  id: string;
  label: string;
};
